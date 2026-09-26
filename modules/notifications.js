(function () {
  const STORAGE_KEY = 'ootie-notifications-v1';
  const LEGACY_STATE_KEY = 'weary-app-state-v1';
  const defaultNotifications = [
    { id:'notification-01', text:'@ella 喜歡了你的穿搭。', time:'剛剛', read:false, target:'explore' },
    { id:'notification-02', text:'你的 SOS 穿搭建議獲得了 3 個 Hearts。', time:'1 小時前', read:false, target:'sos' },
    { id:'notification-03', text:'@minji 回覆了你的留言。', time:'昨天', read:true, target:'explore' }
  ];

  let notifications = loadNotifications();
  let badge;
  let list;
  let backdrop;

  function loadNotifications() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== null) {
        const parsed = JSON.parse(current);
        if (Array.isArray(parsed)) return parsed;
        throw new Error('Stored notification data must be an array.');
      }

      const legacy = JSON.parse(localStorage.getItem(LEGACY_STATE_KEY) || 'null');
      if (legacy && Array.isArray(legacy.notifications)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy.notifications));
        return legacy.notifications;
      }
    } catch (error) {
      console.error('Unable to load saved notifications.', error);
    }
    return JSON.parse(JSON.stringify(defaultNotifications));
  }

  function persistNotifications() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Unable to save notifications.', error);
    }
  }

  function render() {
    if (!badge || !list) return;

    const unreadCount = notifications.filter(notification => !notification.read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount ? 'block' : 'none';
    list.replaceChildren();

    notifications.forEach(notification => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `notification-item ${notification.read ? '' : 'unread'}`.trim();
      item.dataset.notificationTarget = /^[a-z0-9-]+$/i.test(notification.target || '') ? notification.target : 'profile';
      item.append(document.createTextNode(notification.text || ''));

      const time = document.createElement('span');
      time.className = 'notification-time';
      time.textContent = notification.time || '';
      item.append(time);
      list.append(item);
    });
  }

  function close() {
    backdrop?.classList.remove('open');
  }

  function open() {
    notifications.forEach(notification => { notification.read = true; });
    persistNotifications();
    render();
    backdrop?.classList.add('open');
  }

  function mount({ topbarActions, modalSlot }) {
    if (!topbarActions || !modalSlot) {
      throw new Error('Notification module requires the topbar and modal slots.');
    }

    topbarActions.insertAdjacentHTML('beforeend', `
      <button class="icon-button" id="notificationButton" aria-label="通知">
        ♧<span class="notification-badge" id="notificationBadge">0</span>
      </button>
    `);
    modalSlot.insertAdjacentHTML('afterbegin', `
      <div class="modal-backdrop" id="notificationBackdrop">
        <section class="modal notification-modal" role="dialog" aria-modal="true" aria-labelledby="notificationTitle">
          <button class="modal-close" id="closeNotifications" aria-label="關閉">×</button>
          <p class="eyebrow">Community</p>
          <h2 id="notificationTitle">通知</h2>
          <div class="notification-list" id="notificationList"></div>
        </section>
      </div>
    `);

    badge = document.getElementById('notificationBadge');
    list = document.getElementById('notificationList');
    backdrop = document.getElementById('notificationBackdrop');

    document.getElementById('notificationButton').addEventListener('click', open);
    document.getElementById('closeNotifications').addEventListener('click', close);
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) close();
    });
    list.addEventListener('click', event => {
      const item = event.target.closest('[data-notification-target]');
      if (!item) return;
      close();
      window.location.href = `${item.dataset.notificationTarget}.html`;
    });
    render();
  }

  function add(text, target = 'profile') {
    notifications.unshift({
      id:`notification-${Date.now()}`,
      text,
      time:'剛剛',
      read:false,
      target
    });
    persistNotifications();
    render();
  }

  window.OotieNotifications = { mount, add };
})();

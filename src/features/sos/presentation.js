export function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
export function vibeLabel(value) {
  return ({ Soft: '溫柔', Elegant: '優雅', 'Smart Casual': '俐落休閒', Relaxed: '自在', Confident: '自信', Playful: '活潑', Casual: '休閒', Minimal: '簡約', Layered: '層次' })[value] || value;
}
export function sosStatusLabel(value) {
  if (value === 'OPEN') return '徵求搭配中';
  if (value === 'CLOSED') return '已結束';
  return '狀態待確認';
}
export function publicClothingMessage(post, mode) {
  if (!Array.isArray(post?.closet_item_ids) && post?.status === 'CLOSED') return '歷史求救，當時公開的衣物清單未保存。';
  if (mode === 'REMOTE_READ') return '公開衣物的帳號對應尚待驗證，暫不顯示衣物。';
  if (!Array.isArray(post?.closet_item_ids)) return '這筆求救未保存公開衣物清單，無法還原當時的衣物。';
  if (!post.closet_item_ids.length) return '這筆求救沒有公開衣物。';
  return '本次選取的衣物目前無法顯示，可能已移除或資料尚未齊全。';
}

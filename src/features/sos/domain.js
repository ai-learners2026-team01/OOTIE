export const LIMITS = Object.freeze({ title: 100, details: 1500, message: 1000, comment: 500 });
export const asArray = value => Array.isArray(value) ? value : [];
export const textValue = value => typeof value === 'string' ? value.trim() : '';
export const isActiveSuggestion = suggestion => suggestion && !suggestion.deleted_at && !['DELETED', 'WITHDRAWN'].includes(suggestion.status);

export function publicItemsForSos(sos, items) {
  if (!sos?.sender_id || !Array.isArray(sos.closet_item_ids)) return [];
  const ids = new Set(sos.closet_item_ids);
  return asArray(items).filter(item => item?.id != null && item.owner_id === sos.sender_id && ids.has(item.id));
}

export function suggestionBlockReason({ post, actorId, suggestions, publicItems, identityReason }) {
  if (!actorId) return identityReason || '請先確認使用者資料。';
  if (!post) return '找不到這筆求救，請回到求救板重新選擇。';
  if (post.status !== 'OPEN') return '這筆求救已停止接受新的搭配建議。';
  if (post.sender_id === actorId) return '這是你發出的求救，可在下方留言補充需求。';
  if (asArray(suggestions).some(s => isActiveSuggestion(s) && s.sos_id === post.id && (s.responder_id || s.user_id) === actorId)) {
    return '你已提供搭配建議，可在詳情繼續留言交流。';
  }
  if (!publicItems.length) return '目前沒有可搭配的公開衣物，可以先留言詢問。';
  return '';
}

export function ownerActionReason(post, actorId, identityReason) {
  if (!actorId) return identityReason || '請先確認使用者資料。';
  if (!post) return '找不到這筆求救。';
  if (post.sender_id !== actorId) return '只有發布者可以操作這筆求救。';
  if (post.status !== 'OPEN') return '這筆求救已結束，保留原有紀錄。';
  return '';
}

export function validText(value, max) {
  const text = textValue(value);
  return text.length > 0 && text.length <= max;
}

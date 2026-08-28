/** 内部浮层能力统一出口；不得从 packages 公共入口直接暴露。 */
export { activateFocusTrap } from './focus'
export {
  createOverlayManager,
  overlayManager,
  type OverlayHandle,
  type OverlayManager,
  type OverlayRegistration,
  type OverlayType
} from './manager'

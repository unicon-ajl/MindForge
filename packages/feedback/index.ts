/** Feedback Suite 公共出口：组件和命令式 API 保持同一子路径可消费。 */
export { default as MfModal } from './modal/Modal.vue'
export { default as MfLoading } from './loading/Loading.vue'
export { loading } from './loading/loading'
export type { LoadingInstance, LoadingOptions, LoadingSpinnerType } from './loading/loading'
export { default as MfMessage } from './message/Message.vue'
export { message } from './message/message'
export type { MessageHandler, MessageOptions, MessageRecord, MessageType } from './message/message'

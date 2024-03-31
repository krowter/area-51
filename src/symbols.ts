export const controllerCensorOption = Symbol()

declare global {
    interface Window {
        [controllerCensorOption]: 'black-out' | 'blur';
    }
}
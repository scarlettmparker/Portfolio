class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {
        
    }
    unobserve() {}
    disconnect() {}
}

global.IntersectionObserver = IntersectionObserver;
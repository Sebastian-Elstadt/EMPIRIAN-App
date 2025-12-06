export class LoggingService {
    constructor(
        private tag: string,
        private color: string,
        private enabled: boolean = false
    ) { }

    protected LogInfo(...args: any[]) {
        if (this.enabled) console.log(`%c[${this.tag}]`, `color: ${this.color};`, ...args);
    }

    protected LogError(...args: any[]) {
        if (this.enabled) console.error(`%c[${this.tag}]`, `color: ${this.color};`, ...args, (Error()).stack?.replace('Error', ''));
    }

    protected LogWarning(...args: any[]) {
        if (this.enabled) console.warn(`%c[${this.tag}]`, `color: ${this.color};`, ...args, (Error()).stack?.replace('Error', ''));
    }
}
import axios from "axios";

export class AppNotification {
    private readonly webhook: URL;

    constructor(webhook: URL) {
        this.webhook = webhook;
    }

    public async notify(data: any): Promise<void> {
        await axios.post(
            this.webhook.toString(),
            data,
            {
                headers: { "content-type": "application/json" }
            },
        );
    }
}
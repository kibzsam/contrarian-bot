"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramNotifier = void 0;
class TelegramNotifier {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.enabled = !!(this.botToken && this.chatId);
    }
    async send(notification) {
        if (!this.enabled) {
            console.log('[Telegram] Notifications disabled (missing bot token or chat ID)');
            return;
        }
        const emoji = this.getEmoji(notification.type);
        const message = this.formatMessage(notification, emoji);
        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: 'Markdown',
                }),
            });
            console.log(`[Telegram] Notification sent: ${notification.type}`);
        }
        catch (error) {
            console.error('[Telegram] Failed to send notification:', error);
        }
    }
    getEmoji(type) {
        const emojis = {
            TRADE_EXECUTED: '📊',
            TRADE_WON: '✅',
            TRADE_LOST: '❌',
            PANIC_DETECTED: '🚨',
            BOT_STARTED: '🚀',
            BOT_STOPPED: '🛑',
            ERROR: '⚠️',
        };
        return emojis[type];
    }
    formatMessage(notification, emoji) {
        const lines = [
            `${emoji} *AI Contrarian Bot*`,
            `━━━━━━━━━━━━━━━━━━`,
            `*Event:* ${notification.type.replace('_', ' ')}`,
            `*Message:* ${notification.message}`,
        ];
        if (notification.details) {
            if (notification.details.tokenId) {
                lines.push(`*Token:* \`${notification.details.tokenId}\``);
            }
            if (notification.details.price !== undefined) {
                lines.push(`*Price:* $${notification.details.price.toFixed(4)}`);
            }
            if (notification.details.volume !== undefined) {
                lines.push(`*Volume:* $${notification.details.volume.toLocaleString()}`);
            }
            if (notification.details.amount !== undefined) {
                lines.push(`*Amount:* $${notification.details.amount}`);
            }
            if (notification.details.profit !== undefined) {
                const sign = notification.details.profit >= 0 ? '+' : '';
                lines.push(`*Profit:* ${sign}$${notification.details.profit.toFixed(2)}`);
            }
            if (notification.details.probability !== undefined) {
                lines.push(`*AI Probability:* ${(notification.details.probability * 100).toFixed(1)}%`);
            }
            if (notification.details.error) {
                lines.push(`*Error:* \`${notification.details.error}\``);
            }
        }
        lines.push(`━━━━━━━━━━━━━━━━━━`);
        lines.push(`_Sent from Contrarian Bot_`);
        return lines.join('\n');
    }
    async notifyTradeExecuted(tokenId, price, amount, probability) {
        await this.send({
            type: 'TRADE_EXECUTED',
            message: `Contrarian trade placed!`,
            details: { tokenId, price, amount, probability },
        });
    }
    async notifyTradeWon(tokenId, profit) {
        await this.send({
            type: 'TRADE_WON',
            message: `Trade won! Great call on the contrarian play! 🎉`,
            details: { tokenId, profit },
        });
    }
    async notifyTradeLost(tokenId, profit) {
        await this.send({
            type: 'TRADE_LOST',
            message: `Trade lost. Learning from this... 📚`,
            details: { tokenId, profit },
        });
    }
    async notifyPanicDetected(tokenId, price, volume) {
        await this.send({
            type: 'PANIC_DETECTED',
            message: `Panic selling detected with whale activity`,
            details: { tokenId, price, volume },
        });
    }
    async notifyBotStarted() {
        await this.send({
            type: 'BOT_STARTED',
            message: 'Bot is now online and scanning Polymarket',
        });
    }
    async notifyBotStopped() {
        await this.send({
            type: 'BOT_STOPPED',
            message: 'Bot has been stopped',
        });
    }
    async notifyError(error, context) {
        await this.send({
            type: 'ERROR',
            message: context || 'An error occurred',
            details: { error },
        });
    }
}
exports.telegramNotifier = new TelegramNotifier();
//# sourceMappingURL=TelegramNotifier.js.map
import { type ClientOptions } from '../types/index.js';
import { ERLCAPIError, InvalidCommandError, InvalidGlobalKeyError, InvalidServerKeyError, OutOfDateServerError, ProhibitedMessageError, RestrictedCommandError, RestrictedResourceError, ServerBannedError, ServerOfflineError, UnauthorizedError } from '../errors/index.js';

interface BucketInfo {
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Handles communication with the ER:LC HTTP API, managing rate limits and request queuing.
 * @public
 */
export class RestManager {
    private queue: Array<{
        endpoint: string;
        execute: () => Promise<any>;
    }> = [];

    private processing = false;
    private readonly baseUrl = 'https://api.erlc.gg';

    private buckets = new Map<string, BucketInfo>();
    private routeToBucket = new Map<string, string>();

    /**
     * Creates an instance of RestManager.
     * @param options - The ClientOptions configuration.
     */
    constructor(private options: ClientOptions) {}

    /**
     * Enqueues and sends an HTTP request to the ER:LC API.
     * @param method - The HTTP method to use ('GET' or 'POST').
     * @param endpoint - The API endpoint path.
     * @param body - The optional request body payload.
     * @returns A promise resolving to the API response data.
     * @throws {@link InvalidServerKeyError} if the server API key is invalid (403).
     * @throws Error - for other HTTP error codes.
     */
    public async request(method: 'GET' | 'POST', endpoint: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxRetries = 3;

            const executeTask = async () => {
                let response: Response;
                
                try {
                    response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method,
                        headers: {
                            'Server-Key': this.options.serverKey,
                            'Content-Type': 'application/json',
                            ...(this.options.globalKey && {
                                Authorization: `${this.options.globalKey}`,
                            }),
                        },
                        body: body ? JSON.stringify(body) : undefined,
                    });
                } catch(networkError) {
                    if (attempts < maxRetries) {
                        attempts++;
                        const delay = Math.pow(2, attempts) * 1000;
                        await new Promise((res) => setTimeout(res, delay));
                        return executeTask();
                    }
                    return reject(new Error(`Network error: ${networkError}`));
                }

                try {
                    this.updateRateLimits(endpoint, response.headers);

                    let data;
                    try {
                        data = await response.json();
                    } catch(err) {
                        data = {};
                    }
                    
                    if (data.code) {
                        switch(data.code) {
                            case 2000:
                            case 2001:
                            case 2002:
                                return reject(new InvalidServerKeyError());
                            case 2003:
                                return reject(new InvalidGlobalKeyError())
                            case 2004:
                                return reject(new ServerBannedError());
                            case 3001:
                                return reject(new InvalidCommandError());
                            case 3002:
                                return reject(new ServerOfflineError());
                            case 4000:
                                return reject(new UnauthorizedError());
                            case 4002:
                                return reject(new RestrictedCommandError());
                            case 4003:
                                return reject(new ProhibitedMessageError());
                            case 9998:
                                return reject(new RestrictedResourceError());
                            case 9999:
                                return reject(new OutOfDateServerError());
                        }
                    }

                    if (response.status === 403) {
                        return reject(new InvalidServerKeyError());
                    }

                    if (response.status === 429 || data.code === 4001) {
                        this.queue.unshift({ endpoint, execute: executeTask });
                        return;
                    }

                    if (response.status >= 500 && response.status < 600 || data.code === 1001 || data.code === 1002 || data.code === 0) {
                        if (attempts < maxRetries) {
                            attempts++;
                            const delay = Math.pow(2, attempts) * 1000;
                            await new Promise((res) => setTimeout(res, delay));
                            return executeTask();
                        }
                        return reject(new ERLCAPIError(`${response.status}: ${response.statusText}\n${data.code}: ${data.message}`));
                    }

                    if (!response.ok) {
                        return reject(new ERLCAPIError(`${response.status}: ${response.statusText}\n${data.code}: ${data.message}`));
                    }

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            this.queue.push({ endpoint, execute: executeTask });
            this.processQueue();
        });
    }

    /**
     * Extracts headers and updates bucket-specific ratelimit.
     */
    private updateRateLimits(endpoint: string, headers: Headers) {
        const bucketId = headers.get('x-ratelimit-bucket') || 'global';
        const limit = parseInt(headers.get('x-ratelimit-limit') || '0', 10);
        const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
        const resetHeader = headers.get('x-ratelimit-reset');

        if (resetHeader) {
            const resetTime = parseInt(resetHeader, 10) * 1000;

            this.routeToBucket.set(endpoint, bucketId);

            this.buckets.set(bucketId, {
                limit,
                remaining,
                reset: resetTime,
            });
        }
    }

    /**
     * Gets wait time for a specific endpoint, returns 0 if not ratelimited.
     */
    private getWaitTime(endpoint: string): number {
        const bucketId = this.routeToBucket.get(endpoint) || 'global';
        const bucket = this.buckets.get(bucketId);

        if (!bucket) return 0;

        const now = Date.now();

        if (now > bucket.reset) {
            bucket.remaining = bucket.limit;
            return 0;
        }

        if (bucket.remaining <= 0) {
            return Math.min(Math.max(0, bucket.reset - now), 2147483647);
        }

        return 0;
    }

    /**
     * Processes the request queue sequentially.
     */
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const nextItem = this.queue[0];
            if (!nextItem) continue;
            const waitTime = this.getWaitTime(nextItem.endpoint);

            if (waitTime > 0) {
                await new Promise((res) => setTimeout(res, waitTime));
                continue;
            }

            this.queue.shift();

            const bucketId = this.routeToBucket.get(nextItem.endpoint) || 'global';
            const bucket = this.buckets.get(bucketId);
            if (bucket) {
                bucket.remaining--;
            }

            nextItem.execute().catch(() => {});
        }

        this.processing = false;
    }
}

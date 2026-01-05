import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamingSubscriber } from './streaming-subscriber';
import type { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import { EventEmitter } from 'events';

describe('StreamingSubscriber', () => {
  const SUBSCRIPTION_NAME = 'my-streaming-subscription';

  let mockPubSub: Partial<PubSub>;
  let mockSubscription: EventEmitter & Partial<Subscription>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscription = new EventEmitter() as EventEmitter & Partial<Subscription>;
    mockPubSub = {
      subscription: vi.fn().mockReturnValue(mockSubscription),
    };
  });

  afterEach(() => {
    mockSubscription.removeAllListeners();
  });

  describe('constructor', () => {
    it('指定したサブスクリプション名でサブスクリプションを取得する', () => {
      new StreamingSubscriber(mockPubSub as PubSub, SUBSCRIPTION_NAME);

      expect(mockPubSub.subscription).toHaveBeenCalledWith(SUBSCRIPTION_NAME);
    });
  });

  describe('start', () => {
    it('サブスクリプションにメッセージリスナーを登録する', () => {
      const subscriber = new StreamingSubscriber(mockPubSub as PubSub, SUBSCRIPTION_NAME);
      subscriber.start();

      expect(mockSubscription.listenerCount('message')).toBe(1);
      expect(mockSubscription.listenerCount('error')).toBe(1);
    });

    it('メッセージを受信するとログ出力して ack する', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockAck = vi.fn();
      const mockMessage = {
        id: 'msg-123',
        data: Buffer.from(JSON.stringify({ test: 'data' })),
        attributes: { key: 'value' },
        ack: mockAck,
        nack: vi.fn(),
      } as unknown as Message;

      const subscriber = new StreamingSubscriber(mockPubSub as PubSub, SUBSCRIPTION_NAME);
      subscriber.start();

      mockSubscription.emit('message', mockMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StreamingSubscriber] Received message msg-123'),
      );
      expect(mockAck).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('メッセージ処理でエラーが発生すると nack する', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockNack = vi.fn();
      const mockMessage = {
        id: 'msg-456',
        data: Buffer.from('invalid json'),
        attributes: {},
        ack: vi.fn(),
        nack: mockNack,
      } as unknown as Message;

      const subscriber = new StreamingSubscriber(mockPubSub as PubSub, SUBSCRIPTION_NAME);
      subscriber.start();

      mockSubscription.emit('message', mockMessage);

      expect(mockNack).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StreamingSubscriber] Error processing message msg-456'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('サブスクリプションエラーをログ出力する', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Subscription error');

      const subscriber = new StreamingSubscriber(mockPubSub as PubSub, SUBSCRIPTION_NAME);
      subscriber.start();

      mockSubscription.emit('error', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[StreamingSubscriber] Subscription error:',
        testError,
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

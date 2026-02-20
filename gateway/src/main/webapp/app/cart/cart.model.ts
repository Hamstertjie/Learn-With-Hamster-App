export interface ICartItem {
  courseId: number;
  courseTitle: string;
  coursePrice: number;
  addedAt: string;
}

export interface IPaymentConfig {
  provider: string;
  publicKey: string;
  currency: string;
}

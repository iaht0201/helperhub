import axios from './apiClient';

export const subscriptionApi = {
    getPricing: () => axios.get('/subscription/pricing'),
    
    // Luồng Fake Gateway Pipeline
    createOrder: (planCode: string) => axios.post('/subscription/create-order', { planCode }),
    
    createPayment: (orderId: string) => axios.post('/subscription/create-payment', { orderId }),
    
    paymentCallback: (orderId: string, resultCode: number) => axios.post('/subscription/callback', { orderId, resultCode }),

    // Cổng cũ (giữ lại nếu cần ref)
    vnpayPayment: (planCode: string) => axios.post('/subscription/vnpay-payment', { planCode }),
    momoPayment: (planCode: string) => axios.post('/subscription/momo-payment', { planCode }),
    zalopayPayment: (planCode: string) => axios.post('/subscription/zalopay-payment', { planCode }),
    demoPayment: (planCode: string) => axios.post('/subscription/demo-payment', { planCode }),
    activateMock: () => axios.post('/subscription/activate-mock'),
    getMySubscriptions: () => axios.get('/subscription/my')
};

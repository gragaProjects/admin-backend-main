const getPaymentConfig = () => {
    return new Promise((resolve, reject) => {
        try {
            const config = {
                phonepe: {
                    sandbox: {
                        merchantId: `M22GP7C1IXZX4`,
                        clientId: `TEST-M22GP7C1IXZX4_25050`,
                        clientSecret: `ZGVjYWFmZDUtNDhiYy00Yjg5LWEwYjgtM2YxYTNiOWU5MDRl`,
                        clientVersion: `1`,
                        phone: `9880772287`,
                        email: `assisthealthsolutions@gmail.com`,
                        baseUrl: `https://api-preprod.phonepe.com/apis/hermes`
                    },
                    production: {
                        merchantId: `M22GP7C1IXZX4`,
                        apiKey: `d90972b6-380b-4d97-ab35-945e4e4fd978`,
                        keyIndex: `1`,
                        phone: `9880772287`,
                        email: `assisthealthsolutions@gmail.com`,
                        baseUrl: `https://api.phonepe.com/apis/hermes`
                    }
                },
                gpay: {
                    test: {
                        merchantId: 'YOUR_TEST_MERCHANT_ID',
                        merchantName: 'YOUR_MERCHANT_NAME',
                        clientId: 'YOUR_TEST_CLIENT_ID',
                        clientSecret: 'YOUR_TEST_CLIENT_SECRET',
                        environment: 'TEST'
                    },
                    production: {
                        merchantId: 'YOUR_PRODUCTION_MERCHANT_ID',
                        merchantName: 'YOUR_MERCHANT_NAME',
                        clientId: 'YOUR_PRODUCTION_CLIENT_ID',
                        clientSecret: 'YOUR_PRODUCTION_CLIENT_SECRET',
                        environment: 'PRODUCTION'
                    }
                }
            };
            
            resolve(config);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = getPaymentConfig;

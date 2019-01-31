// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import { Constants as WrapperConstants, IEvent } from '@finbook/duo-contract-wrapper';
import DynamoDB, { ScanOutput } from 'aws-sdk/clients/dynamodb';
import AWS from 'aws-sdk/global';
import moment from 'moment';
import * as CST from './constants';
import DynamoUtil from './DynamoUtil';

jest.mock('aws-sdk/clients/dynamodb', () => jest.fn().mockImplementation(() => ({})));
jest.mock('aws-sdk/global', () => ({
	config: {
		update: jest.fn()
	}
}));

const conversion = {
	Items: [
		{
			tokenAInWei: { S: '26160725000000000000' },
			timestampId: { S: '1529559912000|log_22f0329f' },
			blockNumber: { N: '7715602' },
			logStatus: { S: 'mined' },
			systime: { N: '1529560019579' },
			tokenBInWei: { S: '26160725000000000000' },
			sender: { S: '0x00D8d0660b243452fC2f996A892D3083A903576F' },
			feeInWei: { S: '1000000000000000' },
			eventKey: {
				S:
					'0x0f80F055c7482b919183EcD06e0dd5FD7991D309|Create|2018-06-21|0x00D8d0660b243452fC2f996A892D3083A903576F'
			},
			ethAmtInWei: { S: '100000000000000000' },
			blockHash: {
				S: '0xec76167caceb595c96a0571a7e3f288d9af95b9910c7f68e32f02a2c3aa0d8a4'
			},
			transactionHash: {
				S: '0x7283db82115b77c3fa055ec1553acf7c16d3ba1e2db5b2cea1974ba32bad29dc'
			}
		},
		{
			tokenAInWei: { S: '' },
			timestampId: { S: '' },
			blockNumber: { N: '7715602' },
			logStatus: { S: '' },
			systime: { N: '1529560019579' },
			tokenBInWei: { S: '' },
			sender: { S: '' },
			feeInWei: { S: '' },
			eventKey: { S: '' },
			ethAmtInWei: { S: '' },
			blockHash: {
				S: ''
			},
			transactionHash: {
				S: ''
			}
		}
	],
	Count: 1,
	ScannedCount: 1
};

const events: IEvent[] = [
	{
		contractAddress: 'contractAddress',
		type: 'type',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			test: 'test'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'CommitPrice',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			sender: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'Create',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			sender: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'Transfer',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			from: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'Approval',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			tokenOwner: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	},
	{
		contractAddress: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309',
		type: 'TotalSupply',
		id: 'id',
		blockHash: 'blockHash',
		blockNumber: 123,
		transactionHash: 'txHash',
		logStatus: 'logStatus',
		parameters: {
			sender: '0x00D8d0660b243452fC2f996A892D3083A903576F'
		},
		timestamp: 1234567890
	}
];

const prices = {
	Items: [
		{
			timeInSecond: { S: '1529625600' },
			sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
			eventKey: { S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|AcceptPrice|2018-06-22' },
			navAInWei: { S: '1000595000000000000' },
			timestampId: { S: '1529625612000|log_f7abca98' },
			blockNumber: { N: '7722428' },
			logStatus: { S: 'mined' },
			systime: { N: '1529625989069' },
			priceInWei: { S: '525469771414597000000' },
			navBInWei: { S: '1008025829180372484' },
			blockHash: {
				S: '0xdb41c94c37dad7feb9959c98c70bdaecb82022dd2484d27188452d559cd71eb5'
			},
			transactionHash: {
				S: '0x180245f592adfd86dfb49a48c6c9b59d6be7a8d9c897ebd5492f0823c5196008'
			}
		},
		{
			timeInSecond: { S: '1529629200' },
			sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
			eventKey: { S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|AcceptPrice|2018-06-22' },
			navAInWei: { S: '1000612000000000000' },
			timestampId: { S: '1529629212000|log_70c6f8ed' },
			blockNumber: { N: '7722781' },
			logStatus: { S: 'mined' },
			systime: { N: '1529629589112' },
			priceInWei: { S: '524316000000000000000' },
			navBInWei: { S: '1003598510220951444' },
			blockHash: {
				S: '0x38bcf38c49545b8e0e392974b8d22468a60937594c283a06a3ee3770e188414f'
			},
			transactionHash: {
				S: '0x4da754a05a29dd84a26a81db5a6d437be018971c652a94d0c706128bad63dc87'
			}
		},
		{
			timeInSecond: { S: '1529632800' },
			sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
			eventKey: { S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|AcceptPrice|2018-06-22' },
			navAInWei: { S: '1000629000000000000' },
			timestampId: { S: '1529632812000|log_964e7ac0' },
			blockNumber: { N: '7723130' },
			logStatus: { S: 'mined' },
			systime: { N: '1529633189508' },
			priceInWei: { S: '511610500000000000000' },
			navBInWei: { S: '955014431135796120' },
			blockHash: {
				S: '0xcf4569e2774a3a6fe6bd1833b6c66b8276cc106f6579caa1fca6adf898ba5f0b'
			},
			transactionHash: {
				S: '0x298dc4d2771805df61894777a6a2eee702d222ab51c1c5239d890d66412b64e0'
			}
		},
		{
			timeInSecond: { S: '1529636400' },
			sender: { S: '0x002002812b42601Ae5026344F0395E68527bb0F8' },
			eventKey: { S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|AcceptPrice|2018-06-22' },
			navAInWei: { S: '1000646000000000000' },
			timestampId: { S: '1529636412000|log_c0cbb602' },
			blockNumber: { N: '7723483' },
			logStatus: { S: 'mined' },
			systime: { N: '1529636789744' },
			priceInWei: { S: '515602814478067700000' },
			navBInWei: { S: '970258149170436598' },
			blockHash: {
				S: '0x36941976a7798633aaf63ea130287317ef26670eb09ceb2b30d8307f9bcb30e3'
			},
			transactionHash: {
				S: '0xef0aab40c21251ddbed21d03f43f81a0e000b651a355dc2e0ac6bdd2934e449d'
			}
		},
		{
			timeInSecond: { S: '1529640000' },
			sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
			eventKey: { S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|AcceptPrice|2018-06-22' },
			navAInWei: { S: '1000663000000000000' },
			timestampId: { S: '1529640012000|log_c9b92ac6' },
			blockNumber: { N: '7723836' },
			logStatus: { S: 'mined' },
			systime: { N: '1529640390161' },
			priceInWei: { S: '516273720464749900000' },
			navBInWei: { S: '972805703427561352' },
			blockHash: {
				S: '0x4d2eb87d8935426785cdcd1dff2f841d3fd198a36bfc83a4c78ca73d2b422c3f'
			},
			transactionHash: {
				S: '0x060f2496b45b7d11908549bb4e3e1a6cc789692caf24c9f632daf5e23ce3a481'
			}
		}
	],
	Count: 5,
	ScannedCount: 5
};

const status: ScanOutput = {
	Items: [
		{
			process: {
				S: 'TRADE_AWS_PUBLIC_GEMINI'
			},
			amount: {
				N: '0.021854'
			},
			systime: {
				N: '1528081767574'
			},
			id: {
				S: '3830124454'
			},
			price: {
				N: '617.67'
			},
			timestamp: {
				N: '1528081767414'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PRIVATE_GDAX'
			},
			amount: {
				N: '0.112'
			},
			systime: {
				N: '1527756999570'
			},
			id: {
				S: '35215127'
			},
			price: {
				N: '568.74'
			},
			timestamp: {
				N: '1527756997255'
			}
		},
		{
			process: {
				S: 'MINUTELY_AWS_PUBLIC'
			},
			timestamp: {
				N: '1528081764433'
			}
		},
		{
			process: {
				S: 'HOURLY_AWS_PUBLIC'
			},
			timestamp: {
				N: '1528081753755'
			}
		},
		{
			process: {
				S: 'EVENT_AWS_PRIVATE_STARTPRERESET'
			},
			timestamp: {
				N: '1527751553589'
			}
		},
		{
			process: {
				S: 'FEED_AZURE_PRIVATE'
			},
			volume: {
				N: '210.82909559000007'
			},
			price: {
				N: '569.4241372856894'
			},
			timestamp: {
				N: '1527758100003'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PRIVATE_BITFINEX'
			},
			amount: {
				N: '2'
			},
			systime: {
				N: '1527832175767'
			},
			id: {
				S: '252575853'
			},
			price: {
				N: '573.84'
			},
			timestamp: {
				N: '1527831872000'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PRIVATE_KRAKEN'
			},
			amount: {
				N: '1.3'
			},
			systime: {
				N: '1527757007297'
			},
			id: {
				S: '1527756882730'
			},
			price: {
				N: '567.99'
			},
			timestamp: {
				N: '1527756882730'
			}
		},
		{
			process: {
				S: 'TRADE_GCP_PRIVATE_GEMINI'
			},
			amount: {
				N: '0.005219'
			},
			systime: {
				N: '1527766671464'
			},
			id: {
				S: '3806183351'
			},
			price: {
				N: '575.41'
			},
			timestamp: {
				N: '1527766669797'
			}
		},
		{
			process: {
				S: 'EVENT_AZURE_PRIVATE_STARTPRERESET'
			},
			timestamp: {
				N: '1527752331975'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PUBLIC_GDAX'
			},
			amount: {
				N: '6.52551355'
			},
			systime: {
				N: '1528081165788'
			},
			id: {
				S: '35402654'
			},
			price: {
				N: '616.14'
			},
			timestamp: {
				N: '1528081164613'
			}
		},
		{
			process: {
				S: 'TRADE_GCP_PRIVATE_BITFINEX'
			},
			amount: {
				N: '5.16121098'
			},
			systime: {
				N: '1527766706062'
			},
			id: {
				S: '252310341'
			},
			price: {
				N: '575.97'
			},
			timestamp: {
				N: '1527766704000'
			}
		},
		{
			process: {
				S: 'EVENT_GCP_PRIVATE_STARTPRERESET'
			},
			timestamp: {
				N: '1527752140470'
			}
		},
		{
			process: {
				S: 'TRADE_AZURE_PRIVATE_GEMINI'
			},
			amount: {
				N: '0.714947'
			},
			systime: {
				N: '1527757199295'
			},
			id: {
				S: '3805433931'
			},
			price: {
				N: '569.01'
			},
			timestamp: {
				N: '1527757197779'
			}
		},
		{
			process: {
				S: 'EVENT_GCP_PRIVATE_STARTRESET'
			},
			timestamp: {
				N: '1527752036379'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PUBLIC_BITFINEX'
			},
			amount: {
				N: '1.608'
			},
			systime: {
				N: '1528081780852'
			},
			id: {
				S: '253728500'
			},
			price: {
				N: '617.38'
			},
			timestamp: {
				N: '1528081780000'
			}
		},
		{
			process: {
				S: 'EVENT_AWS_PUBLIC_OTHERS'
			},
			block: {
				N: '7535634'
			},
			timestamp: {
				N: '1527846160749'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PUBLIC_KRAKEN'
			},
			amount: {
				N: '1.13'
			},
			systime: {
				N: '1528081780087'
			},
			id: {
				S: '1528081700549'
			},
			price: {
				N: '617.85'
			},
			timestamp: {
				N: '1528081700549'
			}
		},
		{
			process: {
				S: 'EVENT_AZURE_PRIVATE_STARTRESET'
			},
			timestamp: {
				N: '1527751947443'
			}
		},
		{
			process: {
				S: 'TRADE_AWS_PRIVATE_GEMINI'
			},
			amount: {
				N: '0.034274'
			},
			systime: {
				N: '1527757023351'
			},
			id: {
				S: '3805419800'
			},
			price: {
				N: '568.9'
			},
			timestamp: {
				N: '1527757021801'
			}
		},
		{
			process: {
				S: 'TRADE_AZURE_PRIVATE_KRAKEN'
			},
			amount: {
				N: '0.29453729'
			},
			systime: {
				N: '1527757219682'
			},
			id: {
				S: '1527757210567'
			},
			price: {
				N: '569.3'
			},
			timestamp: {
				N: '1527757210567'
			}
		},
		{
			process: {
				S: 'EVENT_AWS_PRIVATE_STARTRESET'
			},
			timestamp: {
				N: '1527751833800'
			}
		},
		{
			process: {
				S: 'TRADE_GCP_PRIVATE_KRAKEN'
			},
			amount: {
				N: '0.2'
			},
			systime: {
				N: '1527766716879'
			},
			id: {
				S: '1527766688094'
			},
			price: {
				N: '575.04'
			},
			timestamp: {
				N: '1527766688094'
			}
		},
		{
			process: {
				S: 'TRADE_AZURE_PRIVATE_BITFINEX'
			},
			amount: {
				N: '0.02548273'
			},
			systime: {
				N: '1527757210861'
			},
			id: {
				S: '252280437'
			},
			price: {
				N: '569.89'
			},
			timestamp: {
				N: '1527757209000'
			}
		},
		{
			process: {
				S: 'TRADE_AZURE_PRIVATE_GDAX'
			},
			amount: {
				N: '0.69683'
			},
			systime: {
				N: '1527757219988'
			},
			id: {
				S: '35215259'
			},
			price: {
				N: '569.09'
			},
			timestamp: {
				N: '1527757217889'
			}
		},
		{
			process: {
				S: 'TRADE_GCP_PRIVATE_GDAX'
			},
			amount: {
				N: '0.7576'
			},
			systime: {
				N: '1527766706635'
			},
			id: {
				S: '35220085'
			},
			price: {
				N: '575'
			},
			timestamp: {
				N: '1527766704262'
			}
		},
		{
			process: {
				S: 'FEED_AWS_PRIVATE'
			},
			volume: {
				N: '136.97828929999997'
			},
			price: {
				N: '584.6845'
			},
			timestamp: {
				N: '1527851700049'
			}
		},
		{
			process: {
				S: ''
			},
			volume: {
				N: '1085.5908951400004'
			},
			price: {
				N: '570.3235'
			},
			timestamp: {
				N: '1527757500018'
			}
		}
	],
	Count: 28,
	ScannedCount: 28
};

const totalSupply = {
	Items: [
		{
			eventKey: {
				S: '0x0f80F055c7482b919183EcD06e0dd5FD7991D309|TotalSupply|2018-06-13-03'
			},
			timestampId: { S: '1528862200000|log_a3d23f19' },
			totalSupplyA: { S: '0' },
			blockNumber: { N: '7650502' },
			logStatus: { S: 'mined' },
			totalSupplyB: { S: '0' },
			systime: { N: '1528863378587' },
			blockHash: {
				S: '0x1e8f9e296b0f7e011274bb82349c658ad7b78f0af2177c2f52441e1bf14cf38f'
			},
			transactionHash: {
				S: '0xd7c9bf35f925a8353032cfe1178439617997d6e27484465d393de3d38f8331ab'
			}
		},
		{
			eventKey: { S: '' },
			timestampId: { S: '' },
			totalSupplyA: { S: '' },
			blockNumber: { N: '7651095' },
			logStatus: { S: '' },
			totalSupplyB: { S: '' },
			systime: { N: '1528868188513' },
			blockHash: {
				S: ''
			},
			transactionHash: {
				S: ''
			}
		}
	],
	Count: 2,
	ScannedCount: 2
};

const uiCreate = {
	Items: [
		{
			eth: { N: '0.21704519241528358' },
			fee: { N: '0.0021704519241528358' },
			eventKey: {
				S:
					'0x0f80F055c7482b919183EcD06e0dd5FD7991D309|Create|0xf5921ff118e7Fb7fE74559A3632fB2d0bcc35AF2'
			},
			tokenA: { N: '36.9599025612444' },
			tokenB: { N: '36.9599025612444' },
			systime: { N: '1529317121530' },
			transactionHash: {
				S: '0x8e59dff2458a76b2ba0a9e11413e603cddc227d663a8bf7b45e0241f3896424d'
			}
		},
		{
			eth: { N: '0.21704519241528358' },
			fee: { N: '0.0021704519241528358' },
			eventKey: { S: '' },
			tokenA: { N: '36.9599025612444' },
			tokenB: { N: '36.9599025612444' },
			systime: { N: '1529317121530' },
			transactionHash: {
				S: ''
			}
		}
	],
	Count: 1,
	ScannedCount: 1
};

const uiRedeem = {
	Items: [
		{
			eth: { N: '0.20051663085602844' },
			fee: { N: '0.002.0051663085602844' },
			eventKey: {
				S:
					'0x0f80F055c7482b919183EcD06e0dd5FD7991D309|Redeem|0xf5921ff118e7Fb7fE74559A3632fB2d0bcc35AF2'
			},
			tokenA: { N: '34.14530889109876' },
			tokenB: { N: '34.14530889109876' },
			systime: { N: '1529317783500' },
			transactionHash: {
				S: '0x94ea38c42188eaacfa75ad0a091866b46f4c75993d33c94c8cc22822433ca244'
			}
		},
		{
			eth: { N: '0.20051663085602844' },
			fee: { N: '0.002.0051663085602844' },
			eventKey: { S: '' },
			tokenA: { N: '34.14530889109876' },
			tokenB: { N: '34.14530889109876' },
			systime: { N: '' },
			transactionHash: {
				S: ''
			}
		}
	],
	Count: 1,
	ScannedCount: 1
};

DynamoUtil.getUTCNowTimestamp = jest.fn(() => 1234567890).bind(DynamoUtil);

const dynamoUtil = new DynamoUtil('config' as any, true, 'process');

test('constructor', async () => {
	expect((DynamoDB as any).mock.calls).toMatchSnapshot();
	expect(dynamoUtil.ddb).toBeTruthy();
	expect(dynamoUtil.live).toBeTruthy();
	expect(dynamoUtil.process).toBe('process');
	expect((AWS.config.update as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	try {
		await dynamoUtil.insertData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('queryData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		query: mock
	} as any;
	try {
		await dynamoUtil.queryData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('scanData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	try {
		await dynamoUtil.scanData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('deleteData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	try {
		await dynamoUtil.deleteData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('insertData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	await dynamoUtil.insertData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('queryData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		query: mock
	} as any;
	await dynamoUtil.queryData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('scanData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	await dynamoUtil.scanData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('deleteData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	await dynamoUtil.deleteData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('getPriceKeyField', () => {
	expect(dynamoUtil.getPriceKeyField(0)).toBe(CST.DB_SRC_DHM);
	expect(dynamoUtil.getPriceKeyField(1)).toBe(CST.DB_SRC_DH);
	expect(dynamoUtil.getPriceKeyField(60)).toBe(CST.DB_SRC_DATE);
	expect(() => dynamoUtil.getPriceKeyField(2)).toThrowErrorMatchingSnapshot();
});

const trade = {
	quote: 'quote',
	base: 'base',
	source: 'src',
	id: 'id',
	price: 123,
	amount: 456,
	timestamp: 1234567890
};

test('connection initalization', () =>
	dynamoUtil.insertData({} as any).catch(error => expect(error).toMatchSnapshot()));

test('insertStatusData', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertStatusData error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('convertTradeToDynamo', () =>
	expect(dynamoUtil.convertTradeToDynamo(trade, 123)).toMatchSnapshot());

test('convertEventToDynamo', () =>
	events.forEach(event =>
		expect(dynamoUtil.convertEventToDynamo(event, 9876543210)).toMatchSnapshot()
	));

test('insertTradeData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertTradeData dev', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	dynamoUtil.live = false;
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertTradeData insertStatus', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	dynamoUtil.live = false;
	dynamoUtil.insertStatusData = jest.fn();
	await dynamoUtil.insertTradeData(trade, false);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	expect(dynamoUtil.insertStatusData as jest.Mock).not.toBeCalled();
});

test('insertEventsData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.insertEventsData(events);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(
		events.length
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertEventsData live', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	dynamoUtil.live = true;
	await dynamoUtil.insertEventsData(events);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(
		events.length
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertHeartbeat', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHeartbeat();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertHeartbeat error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertHeartbeat({});
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('readLastBlock, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					block: {
						N: 1000000
					}
				}
			]
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('readLastBlock', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					block: {
						N: 1000000
					}
				}
			]
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('readLastBlock, no Item', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

const dynamoTrade = {
	price: {
		N: 100
	},
	quoteBaseId: {
		S: 'quote|Base|Id'
	},
	sourceDateHourMinute: {
		S: 'source|2018-10-01|01|01'
	},
	timestamp: {
		N: 1234567890000
	},
	amount: {
		N: 12
	}
};
test('getSingleKeyPeriodPrices, period = 0', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoTrade]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, no data', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect(
		(await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')).length
	).toBe(0);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					price: {
						N: 100
					},
					quoteBaseId: {
						S: ''
					},
					sourceDateHourMinute: {
						S: ''
					},
					timestamp: {
						N: 1234567890000
					},
					amount: {
						N: 12
					}
				}
			]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period = 0, no pair', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoTrade]
		})
	);
	expect(await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000)).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

const dynamoPrice1 = {
	sourceDateHour: {
		S: 'source|2018-10-01|01'
	},
	base: {
		S: 'base'
	},
	quote: {
		S: 'quote'
	},
	quoteBaseTimestamp: {
		S: 'quote|base|1234567890000'
	},
	open: {
		N: 100
	},
	high: {
		N: 120
	},
	low: {
		N: 80
	},
	close: {
		N: 110
	},
	volume: {
		N: 20000
	}
};
test('getSingleKeyPeriodPrices, period = 1', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice1]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 1, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, dev', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice1]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 1, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period = 60', async () => {
	const dynamoPrice = {
		sourceDate: {
			S: ''
		},
		base: {
			S: ''
		},
		quote: {
			S: ''
		},
		quoteBaseTimestamp: {
			S: ''
		},
		open: {
			N: 100
		},
		high: {
			N: 120
		},
		low: {
			N: 80
		},
		close: {
			N: 110
		},
		volume: {
			N: 20000
		}
	};
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 60, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period > 60', async () => {
	dynamoUtil.getPriceKeyField = jest.fn(() => 'key');
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [{}]
		})
	);
	try {
		await dynamoUtil.getSingleKeyPeriodPrices('source', 120, 1234567890000, 'quote|base');
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

test('getSingleKeyPeriodPrices, period invalid', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [{}]
		})
	);
	try {
		await dynamoUtil.getSingleKeyPeriodPrices('source', 40, 1234567890000, 'quote|base');
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

const tradeData = {
	quoteBaseId: {
		S: 'quote|base|Id'
	},
	price: {
		N: 120
	},
	amount: {
		N: 10
	},
	sourceDateHourMinute: {
		S: '2018-10-01|01|01'
	},
	pair: {
		S: 'quote|base'
	},
	timestamp: {
		N: 1234567890000
	}
};
test('getTrades', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(
		await dynamoUtil.getTrades('source', '2018-10-01|01|01', 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getTrades, no pair', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(await dynamoUtil.getTrades('source', '2018-10-01|01|01')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getTrades, no pair', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(await dynamoUtil.getTrades('source', '2018-10-01|01|01')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getTrades, no trade', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect((await dynamoUtil.getTrades('source', '2018-10-01|01|01')).length).toBe(0);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getTrades, invalid type', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					quoteBaseId: {
						S: ''
					},
					price: {
						N: 120
					},
					amount: {
						N: 10
					},
					sourceDateHourMinute: {
						S: ''
					},
					pair: {
						S: ''
					},
					timestamp: {
						N: 1234567890000
					}
				}
			]
		})
	);
	expect(
		await dynamoUtil.getTrades('source', '2018-10-01|01|01', 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('scanStatus', async () => {
	dynamoUtil.scanData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.scanStatus();
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('scanStatus, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.scanData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.scanStatus();
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

const convertedStatus = dynamoUtil.parseStatus(status);
test('parseStatus', () => expect(convertedStatus).toMatchSnapshot());

test('queryAcceptPriceEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryAcceptPriceEvent(WrapperConstants.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('queryAcceptPriceEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryAcceptPriceEvent(WrapperConstants.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('parseAcceptedPrices', () => expect(dynamoUtil.parseAcceptedPrice(prices)).toMatchSnapshot());
test('parseAcceptedPrices, invalid type', () =>
	expect(
		dynamoUtil.parseAcceptedPrice({
			Items: [
				{
					timeInSecond: { S: '1529625600' },
					sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
					eventKey: {
						S: ''
					},
					navAInWei: { S: '' },
					timestampId: { S: '1529625612000|log_f7abca98' },
					blockNumber: { N: '7722428' },
					logStatus: { S: 'mined' },
					systime: { N: '1529625989069' },
					priceInWei: { S: '' },
					navBInWei: { S: '' },
					blockHash: {
						S: '0xdb41c94c37dad7feb9959c98c70bdaecb82022dd2484d27188452d559cd71eb5'
					},
					transactionHash: {
						S: ''
					}
				}
			]
		})
	).toMatchSnapshot());
test('parseAcceptedPrices, invalid type', () =>
	expect(
		dynamoUtil.parseAcceptedPrice({
			Items: [
				{
					timeInSecond: { S: '1529625600' },
					sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
					eventKey: {
						S: ''
					},
					timestampId: { S: '1529625612000|log_f7abca98' },
					blockNumber: { N: '7722428' },
					logStatus: { S: 'mined' },
					systime: { N: '1529625989069' },
					priceInWei: { S: '' },
					blockHash: {
						S: '0xdb41c94c37dad7feb9959c98c70bdaecb82022dd2484d27188452d559cd71eb5'
					},
					transactionHash: {
						S: ''
					}
				}
			]
		})
	).toMatchSnapshot());

test('queryConversionEvent', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryConversionEvent(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR,
		['date1', 'date2']
	);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('queryConversionEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryConversionEvent(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR,
		['date1', 'date2']
	);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('parseConversion', () => expect(dynamoUtil.parseConversion(conversion)).toMatchSnapshot());

test('queryTotalSupplyEvent, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryTotalSupplyEvent(WrapperConstants.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('queryTotalSupplyEvent', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryTotalSupplyEvent(WrapperConstants.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('parseTotalSupply', () => expect(dynamoUtil.parseTotalSupply(totalSupply)).toMatchSnapshot());

test('queryUIConversionEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryUIConversionEvent(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR
	);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

const uiConversionData = {
	eventKey: {
		S: 'eventKey'
	},

	transactionHash: {
		S: 'txHash'
	},
	systime: {
		N: 1234567890000
	},
	eth: {
		N: 12
	},
	tokenA: {
		N: 12
	},
	tokenB: {
		N: 12
	},
	fee: {
		N: 1
	}
};

test('queryUIConversionEvent, status', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [uiConversionData]
		})
	);

	await dynamoUtil.queryUIConversionEvent(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR
	);
});

test('queryUIConversionEvent, status', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [uiConversionData]
		})
	);

	await dynamoUtil.queryUIConversionEvent(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR
	);
});

test('parseUIConversion', () => {
	expect(dynamoUtil.parseUIConversion(uiCreate)).toMatchSnapshot();
	expect(dynamoUtil.parseUIConversion(uiRedeem)).toMatchSnapshot();
});

test('getPrices', async () => {
	const start = moment.utc('20181007T235800').valueOf();
	const end = moment.utc('20181008T001000').valueOf();
	dynamoUtil.getSingleKeyPeriodPrices = jest.fn(() =>
		Promise.resolve([
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 0.0007
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 17.6757
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 202.12,
				high: 202.12,
				low: 202.12,
				close: 202.12,
				volume: 0.0013
			}
		])
	);
	await dynamoUtil.getPrices('anySrc', 1, start);
	await dynamoUtil.getPrices('anySrc', 1, start, end);
	await dynamoUtil.getPrices('anySrc', 1, start, end, 'ETH|USD');
	await dynamoUtil.getPrices('anySrc', 60, start, end);
	expect(
		(dynamoUtil.getSingleKeyPeriodPrices as jest.Mock<Promise<void>>).mock.calls
	).toMatchSnapshot();
});

const price = {
	source: 'source',
	base: 'base',
	quote: 'quote',
	timestamp: 1234567890,
	period: 1,
	open: 2,
	high: 4,
	low: 0,
	close: 3,
	volume: 5
};

test('addPrice', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.addPrice(price);
	price.period = 10;
	await dynamoUtil.addPrice(price);
	price.period = 60;
	await dynamoUtil.addPrice(price);
	price.period = 360;
	await dynamoUtil.addPrice(price);
	price.period = 1440;
	await dynamoUtil.addPrice(price);
	price.period = 1440;
	dynamoUtil.live = false;
	await dynamoUtil.addPrice(price);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	price.period = 40;
	try {
		await dynamoUtil.addPrice(price);
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

test('insertUIConversion', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertUIConversion(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR,
		'0x123',
		true,
		123,
		456,
		456,
		0.123
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertUIConversion, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertUIConversion(
		WrapperConstants.DUMMY_ADDR,
		WrapperConstants.DUMMY_ADDR,
		'0x123',
		false,
		123,
		456,
		456,
		0.123
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('deleteUIConversionEvent', async () => {
	dynamoUtil.deleteData = jest.fn(() => Promise.resolve());
	await dynamoUtil.deleteUIConversionEvent(WrapperConstants.DUMMY_ADDR, {
		contractAddress: 'contractAddress',
		type: 'type',
		transactionHash: 'txHash',
		eth: 0,
		tokenA: 0,
		tokenB: 0,
		timestamp: 0,
		blockNumber: 0,
		fee: 0
	});
	expect((dynamoUtil.deleteData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('deleteUIConversionEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.deleteData = jest.fn(() => Promise.resolve());
	await dynamoUtil.deleteUIConversionEvent(WrapperConstants.DUMMY_ADDR, {
		contractAddress: 'contractAddress',
		type: 'type',
		transactionHash: 'txHash',
		eth: 0,
		tokenA: 0,
		tokenB: 0,
		timestamp: 0,
		blockNumber: 0,
		fee: 0
	});
	expect((dynamoUtil.deleteData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices', async () => {
	DynamoUtil.getUTCNowTimestamp = jest.fn(() => 9876543210).bind(DynamoUtil);
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 10, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 60, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 360, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1440, 1234567890);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

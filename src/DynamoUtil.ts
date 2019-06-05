import { Constants as WrapperConstants, IEvent, Web3Wrapper } from '@finbook/duo-contract-wrapper';
import DynamoDB, {
	AttributeMap,
	DeleteItemInput,
	PutItemInput,
	QueryInput,
	QueryOutput,
	ScanInput,
	ScanOutput
} from 'aws-sdk/clients/dynamodb';
import AWS from 'aws-sdk/global';
import moment from 'moment';
import * as CST from './constants';
import {
	IAcceptedPrice,
	IConversion,
	IPrice,
	IPriceStatus,
	IStake,
	IStatus,
	ITotalSupply,
	ITrade
} from './types';

export class DynamoUtil {
	public ddb: DynamoDB;
	public process: string = 'UNKNOWN';
	public live: boolean = false;
	constructor(config: object, live: boolean, process: string) {
		this.live = live;
		this.process = process;
		AWS.config.update(config);
		this.ddb = new DynamoDB({ apiVersion: CST.AWS_DYNAMO_API_VERSION });
	}

	public insertData(params: PutItemInput): Promise<void> {
		return new Promise((resolve, reject) =>
			this.ddb.putItem(params, err => (err ? reject(err) : resolve()))
		);
	}

	public queryData(params: QueryInput): Promise<QueryOutput> {
		return new Promise((resolve, reject) =>
			this.ddb.query(params, (err, data) => (err ? reject(err) : resolve(data)))
		);
	}

	public scanData(params: ScanInput): Promise<ScanOutput> {
		return new Promise((resolve, reject) =>
			this.ddb.scan(params, (err, data) => (err ? reject(err) : resolve(data)))
		);
	}

	public deleteData(params: DeleteItemInput): Promise<void> {
		return new Promise((resolve, reject) =>
			this.ddb.deleteItem(params, err => (err ? reject(err) : resolve()))
		);
	}

	public convertTradeToDynamo(trade: ITrade, systime: number): AttributeMap {
		return {
			[CST.DB_TX_QUOTE_BASE_ID]: { S: `${trade.quote}|${trade.base}|${trade.id}` },
			[CST.DB_TX_PRICE]: { N: trade.price.toString() },
			[CST.DB_TX_AMOUNT]: { N: trade.amount.toString() },
			[CST.DB_TX_TS]: { N: trade.timestamp + '' },
			[CST.DB_TX_SYSTIME]: { N: systime + '' },
			[CST.DB_TX_PAIR]: { S: `${trade.quote}|${trade.base}` }
		};
	}

	public convertEventToDynamo(event: IEvent, sysTime: number): AttributeMap {
		let addr = '';
		if (
			event.type === WrapperConstants.EVENT_CREATE ||
			event.type === WrapperConstants.EVENT_REDEEM
		)
			addr = event.parameters['sender'];
		else if (event.type === WrapperConstants.EVENT_TRANSFER) addr = event.parameters['from'];
		else if (event.type === WrapperConstants.EVENT_APPROVAL)
			addr = event.parameters['tokenOwner'];
		const dbInput: AttributeMap = {
			[CST.DB_EV_KEY]: {
				S:
					event.contractAddress +
					'|' +
					event.type +
					'|' +
					moment
						.utc(event.timestamp)
						.format(
							event.type === WrapperConstants.EVENT_TOTAL_SUPPLY
								? 'YYYY-MM-HH'
								: 'YYYY-MM-DD'
						) +
					(addr ? '|' + addr : '')
			},
			[CST.DB_EV_TIMESTAMP_ID]: { S: event.timestamp + '|' + event.id },
			[CST.DB_EV_SYSTIME]: { N: sysTime + '' },
			[CST.DB_EV_BLOCK_HASH]: { S: event.blockHash },
			[CST.DB_EV_BLOCK_NO]: { N: event.blockNumber + '' },
			[CST.DB_EV_TX_HASH]: { S: event.transactionHash },
			[CST.DB_EV_LOG_STATUS]: { S: event.logStatus || 'mined' }
		};
		for (const key in event.parameters)
			dbInput[key] = {
				S: event.parameters[key].toString()
			};
		return dbInput;
	}

	public async insertTradeData(trade: ITrade, insertStatus: boolean): Promise<void> {
		const systemTimestamp = DynamoUtil.getUTCNowTimestamp(); // record down the MTS
		const data = this.convertTradeToDynamo(trade, systemTimestamp);

		const params = {
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_TRADES}`
				: `${CST.DB_DUO}.${CST.DB_TRADES}.${CST.DB_DEV}`,
			Item: {
				[CST.DB_TX_SRC_DHM]: {
					S: trade.source + '|' + moment.utc(trade.timestamp).format('YYYY-MM-DD-HH-mm')
				},
				...data
			}
		};

		await this.insertData(params);
		if (insertStatus) await this.insertStatusData(data);
	}

	public async insertEventsData(events: IEvent[]) {
		const systime = DynamoUtil.getUTCNowTimestamp();
		const TableName = this.live
			? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_EVENTS}`
			: `${CST.DB_DUO}.${CST.DB_EVENTS}.${CST.DB_DEV}`;
		// const putItem: any;

		events.forEach(async event => {
			const data = this.convertEventToDynamo(event, systime);
			const params = {
				TableName: TableName,
				Item: {
					...data
				}
			};

			await this.insertData(params);
		});
	}

	public getPriceKeyField(period: number) {
		if (period === 0) return CST.DB_SRC_DHM;
		else if (period === 1) return CST.DB_SRC_DH;
		else if (period === 60) return CST.DB_SRC_DATE;
		else throw new Error('invalid period');
	}

	public insertHeartbeat(data: object = {}): Promise<void> {
		return this.insertData({
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_STATUS}`
				: `${CST.DB_DUO}.${CST.DB_STATUS}.${CST.DB_DEV}`,
			Item: {
				[CST.DB_ST_PROCESS]: {
					S: this.process
				},
				[CST.DB_ST_TS]: { N: DynamoUtil.getUTCNowTimestamp() + '' },
				...data
			}
		}).catch(error => this.log('Error insert heartbeat: ' + error));
	}

	public insertStatusData(data: object): Promise<void> {
		return this.insertData({
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_STATUS}`
				: `${CST.DB_DUO}.${CST.DB_STATUS}.${CST.DB_DEV}`,
			Item: {
				[CST.DB_ST_PROCESS]: {
					S: this.process
				},
				...data
			}
		}).catch(error => this.log('Error insert status: ' + error));
	}

	public async readLastBlock(): Promise<number> {
		const params = {
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_STATUS}`
				: `${CST.DB_DUO}.${CST.DB_STATUS}.${CST.DB_DEV}`,

			KeyConditionExpression: CST.DB_ST_PROCESS + ' = :' + CST.DB_ST_PROCESS,
			ExpressionAttributeValues: {
				[':' + CST.DB_ST_PROCESS]: { S: CST.DB_STATUS_EVENT_PUBLIC_OTHERS }
			}
		};

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return 0;
		return Number(data.Items[0].block.N);
	}

	public async getSingleKeyPeriodPrices(
		src: string,
		period: number,
		timestamp: number,
		pair: string = ''
	) {
		let params: QueryInput;
		if (period === 0) {
			params = {
				TableName: this.live
					? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_TRADES}`
					: `${CST.DB_DUO}.${CST.DB_TRADES}.${CST.DB_DEV}`,
				KeyConditionExpression: `${CST.DB_SRC_DHM} = :${CST.DB_SRC_DHM}`,
				ExpressionAttributeValues: {
					[':' + CST.DB_SRC_DHM]: {
						S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD-HH-mm')}`
					}
				}
			};
			if (pair) {
				params.KeyConditionExpression += ` AND ${
					CST.DB_TX_QUOTE_BASE_ID
				} BETWEEN :start AND :end`;
				if (params.ExpressionAttributeValues) {
					params.ExpressionAttributeValues[':start'] = { S: `${pair}|` };
					params.ExpressionAttributeValues[':end'] = { S: `${pair}|z` };
				}
			}
		} else {
			const keyConditionExpression = `${this.getPriceKeyField(period)} = :primaryValue`;
			let primaryValue;
			if (period <= 10)
				primaryValue = { S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD-HH')}` };
			else if (period === 60)
				primaryValue = {
					S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD')}`
				};
			else if (period > 60)
				primaryValue = {
					S: `${src}|${moment.utc(timestamp).format('YYYY-MM')}`
				};
			else throw new Error('invalid period');

			params = {
				TableName: this.live
					? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_PRICES}.${period}`
					: `${CST.DB_DUO}.${CST.DB_PRICES}.${period}.${CST.DB_DEV}`,
				KeyConditionExpression: keyConditionExpression,
				ExpressionAttributeValues: {
					[':primaryValue']: primaryValue
				}
			};

			if (pair) {
				params.KeyConditionExpression += ` AND ${
					CST.DB_QUOTE_BASE_TS
				} BETWEEN :start AND :end`;
				if (params.ExpressionAttributeValues) {
					params.ExpressionAttributeValues[':start'] = { S: `${pair}|${timestamp}` };
					params.ExpressionAttributeValues[':end'] = {
						S: `${pair}|${DynamoUtil.getUTCNowTimestamp()}`
					};
				}
			}
		}

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return [];
		return data.Items.map(p =>
			period > 0 ? this.parsePrice(p, period) : this.parseTradedPrice(p)
		);
	}

	public parsePrice(data: AttributeMap, period: number): IPrice {
		return {
			source: (data[this.getPriceKeyField(period)].S || '').split('|')[0],
			base: data[CST.DB_TX_BASE].S || '',
			quote: data[CST.DB_TX_QTE].S || '',
			timestamp: Number((data[CST.DB_QUOTE_BASE_TS].S || '').split('|')[2]),
			period: period,
			open: Number(data[CST.DB_OHLC_OPEN].N),
			high: Number(data[CST.DB_OHLC_HIGH].N),
			low: Number(data[CST.DB_OHLC_LOW].N),
			close: Number(data[CST.DB_OHLC_CLOSE].N),
			volume: Number(data[CST.DB_OHLC_VOLUME].N)
		};
	}

	public parseTrade(data: AttributeMap): ITrade {
		return {
			id: (data[CST.DB_TX_QUOTE_BASE_ID].S || '').split('|')[2],
			price: Number(data[CST.DB_TX_PRICE].N),
			amount: Number(data[CST.DB_TX_AMOUNT].N),
			source: (data[CST.DB_SRC_DHM].S || '').split('|')[0],
			base: (data[CST.DB_TX_PAIR].S || '').split('|')[1],
			quote: (data[CST.DB_TX_PAIR].S || '').split('|')[0],
			timestamp: Number(data[CST.DB_TX_TS].N)
		};
	}

	public parseTradedPrice(data: AttributeMap): IPrice {
		const price = Number(data[CST.DB_TX_PRICE].N);
		return {
			source: (data[CST.DB_SRC_DHM].S || '').split('|')[0],
			base: (data[CST.DB_TX_QUOTE_BASE_ID].S || '').split('|')[1],
			quote: (data[CST.DB_TX_QUOTE_BASE_ID].S || '').split('|')[0],
			timestamp: Number(data[CST.DB_TX_TS].N),
			period: 0,
			open: price,
			high: price,
			low: price,
			close: price,
			volume: Number(data[CST.DB_TX_AMOUNT].N)
		};
	}

	public async addPrice(price: IPrice) {
		const data: AttributeMap = {
			[CST.DB_TX_BASE]: { S: price.base },
			[CST.DB_TX_QTE]: { S: price.quote },
			[CST.DB_OHLC_OPEN]: { N: price.open + '' },
			[CST.DB_OHLC_HIGH]: { N: price.high + '' },
			[CST.DB_OHLC_LOW]: { N: price.low + '' },
			[CST.DB_OHLC_CLOSE]: { N: price.close + '' },
			[CST.DB_OHLC_VOLUME]: { N: price.volume + '' },
			[CST.DB_QUOTE_BASE_TS]: {
				S: `${price.quote}|${price.base}|${price.timestamp}`
			},
			[CST.DB_UPDATED_AT]: { N: DynamoUtil.getUTCNowTimestamp() + '' }
		};

		if (price.period <= 10)
			data[CST.DB_SRC_DH] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM-DD-HH')}`
			};
		else if (price.period === 60)
			data[CST.DB_SRC_DATE] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM-DD')}`
			};
		else if (price.period > 60)
			data[CST.DB_SRC_YM] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM')}`
			};
		else throw new Error('invalid period');

		return this.insertData({
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_PRICES}.${price.period}`
				: `${CST.DB_DUO}.${CST.DB_PRICES}.${price.period}.${CST.DB_DEV}`,
			Item: data
		});
	}

	public async getPrices(
		src: string,
		period: number,
		start: number,
		end: number = 0,
		pair: string = ''
	) {
		if (!end) end = DynamoUtil.getUTCNowTimestamp();

		const res = CST.DB_PRICES_PRIMARY_KEY_RESOLUTION[period];
		const primaryKeyPeriodStarts: number[] = [start];
		const dateObj = moment
			.utc(start)
			.startOf(res)
			.add(1, res);
		while (dateObj.valueOf() < end) {
			primaryKeyPeriodStarts.push(dateObj.valueOf());
			dateObj.add(1, res);
		}

		let prices: IPrice[] = [];
		for (const keyPeriodStart of primaryKeyPeriodStarts) {
			const singleKeyPeriodPrices = await this.getSingleKeyPeriodPrices(
				src,
				period,
				keyPeriodStart,
				pair
			);
			singleKeyPeriodPrices.forEach(price => prices.push(price));
		}
		prices = prices.filter(price => price.timestamp >= start && price.timestamp < end);
		prices.sort((a, b) => -a.timestamp + b.timestamp);

		return prices;
	}

	public async getTrades(src: string, dateHourMinute: string, pair: string = '') {
		let params: QueryInput;
		params = {
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_TRADES}`
				: `${CST.DB_DUO}.${CST.DB_TRADES}.${CST.DB_DEV}`,
			KeyConditionExpression: `${CST.DB_SRC_DHM} = :${CST.DB_SRC_DHM}`,
			ExpressionAttributeValues: {
				[':' + CST.DB_SRC_DHM]: {
					S: `${src}|${dateHourMinute}`
				}
			}
		};

		if (pair) {
			params.KeyConditionExpression += ` AND ${
				CST.DB_TX_QUOTE_BASE_ID
			} BETWEEN :start AND :end`;
			if (params.ExpressionAttributeValues) {
				params.ExpressionAttributeValues[':start'] = { S: `${pair}|` };
				params.ExpressionAttributeValues[':end'] = { S: `${pair}|z` };
			}
		}

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return [];
		return data.Items.map(p => this.parseTrade(p));
	}

	public async queryAcceptPriceEvent(contractAddress: string, dates: string[]) {
		const allData: IAcceptedPrice[] = [];
		for (const date of dates)
			allData.push(
				...this.parseAcceptedPrice(
					await this.queryData({
						TableName: this.live
							? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_EVENTS}`
							: `${CST.DB_DUO}.${CST.DB_EVENTS}.${CST.DB_DEV}`,
						KeyConditionExpression: CST.DB_EV_KEY + ' = :' + CST.DB_EV_KEY,
						ExpressionAttributeValues: {
							[':' + CST.DB_EV_KEY]: {
								S:
									contractAddress +
									'|' +
									WrapperConstants.EVENT_ACCEPT_PRICE +
									'|' +
									date
							}
						}
					})
				)
			);
		return allData;
	}

	public parseAcceptedPrice(acceptPrice: QueryOutput): IAcceptedPrice[] {
		if (!acceptPrice.Items || !acceptPrice.Items.length) return [];
		return acceptPrice.Items.map(p => ({
			contractAddress: (p[CST.DB_EV_KEY].S || '').split('|')[0],
			transactionHash: p[CST.DB_EV_TX_HASH].S || '',
			blockNumber: Number(p[CST.DB_EV_BLOCK_NO].N),
			price: Web3Wrapper.fromWei(p[CST.DB_EV_PX].S || ''),
			navA: p[CST.DB_EV_NAV_A] ? Web3Wrapper.fromWei(p[CST.DB_EV_NAV_A].S || '') : 0,
			navB: p[CST.DB_EV_NAV_B] ? Web3Wrapper.fromWei(p[CST.DB_EV_NAV_B].S || '') : 0,
			timestamp: Math.round(Number(p[CST.DB_EV_TS].S) / 3600) * 3600000
		}));
	}

	public async queryTotalSupplyEvent(contractAddress: string, dates: string[]) {
		const allData: ITotalSupply[] = [];
		for (const date of dates)
			allData.push(
				...this.parseTotalSupply(
					await this.queryData({
						TableName: this.live
							? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_EVENTS}`
							: `${CST.DB_DUO}.${CST.DB_EVENTS}.${CST.DB_DEV}`,
						KeyConditionExpression: CST.DB_EV_KEY + ' = :' + CST.DB_EV_KEY,
						ExpressionAttributeValues: {
							[':' + CST.DB_EV_KEY]: {
								S:
									contractAddress +
									'|' +
									WrapperConstants.EVENT_TOTAL_SUPPLY +
									'|' +
									date
							}
						}
					})
				)
			);

		return allData;
	}

	public parseTotalSupply(totalSupply: QueryOutput): ITotalSupply[] {
		if (!totalSupply.Items || !totalSupply.Items.length) return [];
		return totalSupply.Items.map(t => ({
			contractAddress: (t[CST.DB_EV_KEY].S || '').split('|')[0],
			transactionHash: t[CST.DB_EV_TX_HASH].S || '',
			blockNumber: Number(t[CST.DB_EV_BLOCK_NO].N),
			tokenA: Web3Wrapper.fromWei(t[CST.DB_EV_TOTAL_SUPPLY_A].S || ''),
			tokenB: Web3Wrapper.fromWei(t[CST.DB_EV_TOTAL_SUPPLY_B].S || ''),
			timestamp: Number((t[CST.DB_EV_TIMESTAMP_ID].S || '').split('|')[0])
		}));
	}

	public async queryConversionEvent(contractAddress: string, address: string, dates: string[]) {
		const eventKeys: string[] = [];
		dates.forEach(date =>
			eventKeys.push(
				...[WrapperConstants.EVENT_CREATE, WrapperConstants.EVENT_REDEEM].map(
					ev => contractAddress + '|' + ev + '|' + date + '|' + address
				)
			)
		);
		const allData: IConversion[] = [];
		for (const ek of eventKeys)
			allData.push(
				...this.parseConversion(
					await this.queryData({
						TableName: this.live
							? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_EVENTS}`
							: `${CST.DB_DUO}.${CST.DB_EVENTS}.${CST.DB_DEV}`,
						KeyConditionExpression: CST.DB_EV_KEY + ' = :' + CST.DB_EV_KEY,
						ExpressionAttributeValues: {
							[':' + CST.DB_EV_KEY]: { S: ek }
						}
					})
				)
			);
		return allData;
	}

	public parseConversion(conversion: QueryOutput): IConversion[] {
		if (!conversion.Items || !conversion.Items.length) return [];
		return conversion.Items.map(c => {
			const [contractAddress, type] = (c[CST.DB_EV_KEY].S || '').split('|');
			return {
				contractAddress: contractAddress,
				transactionHash: c[CST.DB_EV_TX_HASH].S || '',
				blockNumber: Number(c[CST.DB_EV_BLOCK_NO].N),
				type: type || '',
				timestamp: Number((c[CST.DB_EV_TIMESTAMP_ID].S || '').split('|')[0]),
				eth: Web3Wrapper.fromWei(c[CST.DB_EV_ETH].S || ''),
				tokenA: Web3Wrapper.fromWei(c[CST.DB_EV_TOKEN_A].S || ''),
				tokenB: Web3Wrapper.fromWei(c[CST.DB_EV_TOKEN_B].S || ''),
				fee: Web3Wrapper.fromWei(c[CST.DB_EV_FEE].S || '')
			};
		});
	}

	public async queryStakingEvent(contractAddress: string, dates: string[]) {
		console.log('start querying data');
		const eventKeys: string[] = [];
		dates.forEach(date =>
			eventKeys.push(
				...[WrapperConstants.EVENT_ADD_STAKE, WrapperConstants.EVENT_UN_STAKE].map(
					ev => contractAddress + '|' + ev + '|' + date
				)
			)
		);
		console.log(eventKeys);
		const allData: IStake[] = [];
		for (const ek of eventKeys)
			allData.push(
				...this.parseStaking(
					await this.queryData({
						TableName: this.live
							? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_EVENTS}`
							: `${CST.DB_DUO}.${CST.DB_EVENTS}.${CST.DB_DEV}`,
						KeyConditionExpression: CST.DB_EV_KEY + ' = :' + CST.DB_EV_KEY,
						ExpressionAttributeValues: {
							[':' + CST.DB_EV_KEY]: { S: ek }
						}
					})
				)
			);
		return allData;
	}

	public parseStaking(staking: QueryOutput): IStake[] {
		if (!staking.Items || !staking.Items.length) return [];
		console.log(staking.Items);
		return staking.Items.map(c => {
			const [contractAddress, type] = (c[CST.DB_EV_KEY].S || '').split('|');
			return {
				contractAddress: contractAddress,
				transactionHash: c[CST.DB_EV_TX_HASH].S || '',
				blockNumber: Number(c[CST.DB_EV_BLOCK_NO].N),
				type: type || '',
				timestamp: Number((c[CST.DB_EV_TIMESTAMP_ID].S || '').split('|')[0]),
				from: c[CST.DB_EV_FROM].S || '',
				oracle: c[CST.DB_EV_ORACLE].S || '',
				amount: Web3Wrapper.fromWei(c[CST.DB_EV_AMT].S || '')
			};
		});
	}

	public async scanStatus() {
		return this.parseStatus(
			await this.scanData({
				TableName: this.live
					? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_STATUS}`
					: `${CST.DB_DUO}.${CST.DB_STATUS}.${CST.DB_DEV}`
			})
		);
	}

	public parseStatus(status: ScanOutput): IStatus[] {
		if (!status.Items || !status.Items.length) return [];

		const output = status.Items.map(d => {
			const process = d[CST.DB_ST_PROCESS].S || '';
			const timestamp = Number(d[CST.DB_ST_TS].N);
			if (process.startsWith('TRADE'))
				return {
					process: process,
					timestamp: timestamp,
					price: Number(d[CST.DB_TX_PRICE].N),
					volume: Number(d[CST.DB_TX_AMOUNT].N)
				} as IPriceStatus;
			else if (process.startsWith('EVENT') && process.endsWith('OTHERS'))
				return {
					process: process,
					timestamp: timestamp,
					block: Number(d[CST.DB_ST_BLOCK].N)
				};
			else
				return {
					process: process,
					timestamp: timestamp
				};
		});
		output.sort((a, b) => b.timestamp - a.timestamp);
		output.sort((a, b) => a.process.localeCompare(b.process));

		return output;
	}

	public async insertUIConversion(
		contractAddress: string,
		account: string,
		txHash: string,
		isCreate: boolean,
		eth: number,
		tokenA: number,
		tokenB: number,
		fee: number
	) {
		const params = {
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_UI_EVENTS}`
				: `${CST.DB_DUO}.${CST.DB_UI_EVENTS}.${CST.DB_DEV}`,
			Item: {
				[CST.DB_EV_KEY]: {
					S:
						contractAddress +
						'|' +
						(isCreate ? WrapperConstants.EVENT_CREATE : WrapperConstants.EVENT_REDEEM) +
						'|' +
						account
				},
				[CST.DB_EV_SYSTIME]: { N: DynamoUtil.getUTCNowTimestamp() + '' },
				[CST.DB_EV_TX_HASH]: { S: txHash },
				[CST.DB_EV_UI_ETH]: { N: eth + '' },
				[CST.DB_EV_UI_TOKEN_A]: { N: tokenA + '' },
				[CST.DB_EV_UI_TOKEN_B]: { N: tokenB + '' },
				[CST.DB_EV_UI_FEE]: { N: fee + '' }
			}
		};

		await this.insertData(params);
	}

	public async queryUIConversionEvent(contractAddress: string, account: string) {
		const eventKeys: string[] = [
			WrapperConstants.EVENT_CREATE,
			WrapperConstants.EVENT_REDEEM
		].map(ev => contractAddress + '|' + ev + '|' + account);
		const allData: IConversion[] = [];
		for (const ek of eventKeys)
			allData.push(
				...this.parseUIConversion(
					await this.queryData({
						TableName: this.live
							? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_UI_EVENTS}`
							: `${CST.DB_DUO}.${CST.DB_UI_EVENTS}.${CST.DB_DEV}`,
						KeyConditionExpression: CST.DB_EV_KEY + ' = :' + CST.DB_EV_KEY,
						ExpressionAttributeValues: {
							[':' + CST.DB_EV_KEY]: { S: ek }
						}
					})
				)
			);

		return allData;
	}

	public parseUIConversion(conversion: QueryOutput): IConversion[] {
		if (!conversion.Items || !conversion.Items.length) return [];
		return conversion.Items.map(c => {
			const [contractAddress, type] = (c[CST.DB_EV_KEY].S || '').split('|');
			return {
				contractAddress: contractAddress,
				transactionHash: c[CST.DB_EV_TX_HASH].S || '',
				blockNumber: 0,
				type: type || '',
				timestamp: Number(c[CST.DB_EV_SYSTIME].N || ''),
				eth: Number(c[CST.DB_EV_UI_ETH].N),
				tokenA: Number(c[CST.DB_EV_UI_TOKEN_A].N),
				tokenB: Number(c[CST.DB_EV_UI_TOKEN_B].N),
				fee: Number(c[CST.DB_EV_UI_FEE].N),
				pending: true
			};
		});
	}

	public deleteUIConversionEvent(account: string, conversion: IConversion): Promise<void> {
		return this.deleteData({
			TableName: this.live
				? `${CST.DB_DUO}.${CST.DB_LIVE}.${CST.DB_UI_EVENTS}`
				: `${CST.DB_DUO}.${CST.DB_UI_EVENTS}.${CST.DB_DEV}`,
			Key: {
				[CST.DB_EV_KEY]: {
					S: conversion.contractAddress + '|' + conversion.type + '|' + account
				},
				[CST.DB_EV_TX_HASH]: {
					S: conversion.transactionHash
				}
			}
		});
	}

	private log(text: any) {
		console.log(
			`${moment
				.utc(DynamoUtil.getUTCNowTimestamp())
				.format('DD HH:mm:ss.SSS')} [DynamoUtil]: ` + text
		);
	}

	public static getUTCNowTimestamp() {
		return moment().valueOf();
	}
}

export default DynamoUtil;

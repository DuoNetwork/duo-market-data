export const API_BITFINEX = 'bitfinex';
export const API_BITSTAMP = 'bitstamp';
export const API_GEMINI = 'gemini';
export const API_KRAKEN = 'kraken';
export const API_GDAX = 'gdax';

export const AWS_DYNAMO_API_VERSION = '2012-10-08';

export const DB_DUO = 'duo';
export const DB_TRADES = 'trades';
export const DB_LIVE = 'live';
export const DB_DEV = 'dev';
export const DB_PRICES = 'prices';
export const DB_STATUS = 'status';
export const DB_EVENTS = 'events';
export const DB_UI_EVENTS = 'uiEvents';
export const DB_TX_QTE = 'quote';
export const DB_TX_BASE = 'base';
export const DB_TX_QUOTE_BASE_ID = 'quoteBaseId';
export const DB_TX_SRC = 'source';
export const DB_TX_ID = 'id';
export const DB_TX_PRICE = 'price';
export const DB_TX_AMOUNT = 'amount';
export const DB_TX_TS = 'timestamp';
export const DB_TX_SYSTIME = 'systime';
export const DB_TX_PAIR = 'pair';
export const DB_UPDATED_AT = 'updatedAt';
export const DB_TX_SRC_DHM = 'sourceDateHourMinute';
export const DB_HISTORY_PRICE = 'price';
export const DB_HISTORY_TIMESTAMP = 'timestamp';
export const DB_QUOTE_BASE_TS = 'quoteBaseTimestamp';
export const DB_HISTORY_VOLUME = 'volume';
export const DB_SRC_DHM = 'sourceDateHourMinute';
export const DB_SRC_DH = 'sourceDateHour';
export const DB_SRC_DATE = 'sourceDate';
export const DB_SRC_YM = 'sourceYearMonth';
export const DB_MN_MINUTE = 'minute';
export const DB_OHLC_OPEN = 'open';
export const DB_OHLC_HIGH = 'high';
export const DB_OHLC_LOW = 'low';
export const DB_OHLC_CLOSE = 'close';
export const DB_OHLC_VOLUME = 'volume';
export const DB_OHLC_TS = 'timestamp';
export const DB_ST_PROCESS = 'process';
export const DB_ST_TS = 'timestamp';
export const DB_ST_BLOCK = 'block';
export const DB_ST_SYSTIME = 'systime';
export const DB_EV_KEY = 'eventKey';
export const DB_EV_TIMESTAMP_ID = 'timestampId';
export const DB_EV_SYSTIME = 'systime';
export const DB_EV_BLOCK_HASH = 'blockHash';
export const DB_EV_BLOCK_NO = 'blockNumber';
export const DB_EV_TX_HASH = 'transactionHash';
export const DB_EV_LOG_STATUS = 'logStatus';
export const DB_EV_PX = 'priceInWei';
export const DB_EV_TS = 'timeInSecond';
export const DB_EV_NAV_A = 'navAInWei';
export const DB_EV_NAV_B = 'navBInWei';
export const DB_EV_TOKEN_A = 'tokenAInWei';
export const DB_EV_TOKEN_B = 'tokenBInWei';
export const DB_EV_ETH = 'ethAmtInWei';
export const DB_EV_FEE = 'feeInWei';
export const DB_EV_TOTAL_SUPPLY_A = 'totalSupplyA';
export const DB_EV_TOTAL_SUPPLY_B = 'totalSupplyB';
export const DB_EV_UI_ETH = 'eth';
export const DB_EV_UI_TOKEN_A = 'tokenA';
export const DB_EV_UI_TOKEN_B = 'tokenB';
export const DB_EV_UI_FEE = 'fee';
export const DB_EV_FROM = 'from';
export const DB_EV_ORACLE = 'oracle';
export const DB_EV_AMT = 'amtInWei';
export const DB_EN_SENDER = 'sender';
export const DB_STATUS_EVENT_PUBLIC_OTHERS = 'EVENT_AWS_PUBLIC_OTHERS';

export const DB_PRICES_PRIMARY_KEY_RESOLUTION: {
	[period: number]: 'minute' | 'hour' | 'day' | 'month';
} = {
	0: 'minute',
	1: 'hour',
	10: 'hour',
	60: 'day',
	360: 'month',
	1440: 'month'
};

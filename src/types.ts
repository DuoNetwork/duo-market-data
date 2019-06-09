export interface IBaseMarketData {
	source: string;
	base: string;
	quote: string;
	timestamp: number;
}

export interface ITrade extends IBaseMarketData {
	id: string;
	price: number;
	amount: number;
}

export interface IPriceFix extends IBaseMarketData {
	price: number;
	volume: number;
}

export interface IPrice extends IBaseMarketData {
	period: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface IBaseEvent {
	contractAddress: string;
	timestamp: number;
	transactionHash: string;
	blockNumber: number;
}

export interface IAcceptedPrice extends IBaseEvent {
	price: number;
	navA: number;
	navB: number;
	sender: string;
}

export interface ITotalSupply extends IBaseEvent {
	tokenA: number;
	tokenB: number;
}

export interface IConversion extends IBaseEvent {
	type: string;
	eth: number;
	tokenA: number;
	tokenB: number;
	fee: number;
	pending?: boolean;
	reverted?: boolean;
}

export interface IStake extends IBaseEvent {
	from: string;
	type: string;
	oracle: string;
	amount: number;
}

export interface IStatus {
	process: string;
	timestamp: number;
}

export interface IPriceStatus extends IStatus {
	price: number;
	volume: number;
}

export interface INodeStatus extends IStatus {
	block: number;
}

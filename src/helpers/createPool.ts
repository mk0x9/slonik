import { bindPool } from '../binders/bindPool';
import { poolStateMap } from '../state';
import { type ClientConfigurationInput } from '../types';
import { Logger as log } from './Logger';
import EventEmitter from 'node:events';
import * as sinon from 'sinon';

const defaultConfiguration = {
  interceptors: [],
  typeParsers: [],
};

export const createPool = async (
  clientConfiguration: ClientConfigurationInput = defaultConfiguration,
) => {
  const eventEmitter = new EventEmitter();

  const connection = {
    connection: {
      slonik: {
        connectionId: '1',
        mock: false,
        poolId: '1',
        transactionDepth: null,
      },
    },
    destroy: () => {},
    emit: eventEmitter.emit.bind(eventEmitter),
    end: () => {},
    off: eventEmitter.off.bind(eventEmitter),
    on: eventEmitter.on.bind(eventEmitter),
    query: () => {
      return {};
    },
    release: () => {},
  };

  const internalPool = {
    acquire: () => {
      return connection;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  poolStateMap.set(internalPool, {
    ended: false,
    mock: false,
    poolId: '1',
    typeOverrides: null,
  });

  const acquireSpy: sinon.SinonSpy = sinon.spy(internalPool, 'acquire');
  const endSpy: sinon.SinonSpy = sinon.spy(connection, 'end');
  const querySpy: sinon.SinonStub = sinon.stub(connection, 'query').returns({});
  const releaseSpy: sinon.SinonSpy = sinon.spy(connection, 'release');

  const pool = bindPool(log, internalPool, {
    captureStackTrace: false,
    connectionRetryLimit: 1,
    connectionTimeout: 5_000,
    connectionUri: 'postgres://localhost/test',
    idleInTransactionSessionTimeout: 5_000,
    idleTimeout: 5_000,
    interceptors: [],
    maximumPoolSize: 1,
    queryRetryLimit: 1,
    statementTimeout: 5_000,
    transactionRetryLimit: 1,
    typeParsers: [],
    ...clientConfiguration,
  });

  return {
    ...pool,
    acquireSpy,
    connection,
    endSpy,
    querySpy,
    releaseSpy,
  };
};

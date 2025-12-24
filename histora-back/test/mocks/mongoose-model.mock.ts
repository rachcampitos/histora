import { jest } from '@jest/globals';

export interface MockQuery<T = any> {
  exec: jest.Mock<Promise<T | null>>;
  populate: jest.Mock;
  select: jest.Mock;
  sort: jest.Mock;
  limit: jest.Mock;
  skip: jest.Mock;
  lean: jest.Mock;
  then: (resolve: (value: T | null) => void, reject?: (reason?: any) => void) => Promise<T | null>;
}

export interface MockModel<T = any> {
  new (data?: Partial<T>): MockModelInstance<T>;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findOneAndDelete: jest.Mock;
  create: jest.Mock;
  countDocuments: jest.Mock;
  aggregate: jest.Mock;
}

export interface MockModelInstance<T = any> {
  save: jest.Mock;
  populate: jest.Mock;
  toObject: jest.Mock;
  _id: string;
  [key: string]: any;
}

// Creates a thenable mock query that works with both await and .exec()
function createMockQuery<T>(resolvedValue: T | null): MockQuery<T> {
  const execMock = jest.fn().mockResolvedValue(resolvedValue);

  const query: MockQuery<T> = {
    exec: execMock,
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    // Make it thenable so it works with await directly
    then: (resolve, reject) => execMock().then(resolve, reject),
  };

  // Make populate, select, sort, etc. also thenable
  query.populate = jest.fn().mockImplementation(() => query);
  query.select = jest.fn().mockImplementation(() => query);
  query.sort = jest.fn().mockImplementation(() => query);
  query.limit = jest.fn().mockImplementation(() => query);
  query.skip = jest.fn().mockImplementation(() => query);
  query.lean = jest.fn().mockImplementation(() => query);

  return query;
}

export function createMockModel<T = any>(): MockModel<T> {
  const mockSave = jest.fn();

  // Constructor function that simulates `new Model(data)`
  function MockModelConstructor(this: MockModelInstance<T>, data?: Partial<T>) {
    Object.assign(this, data);
    this._id = data?.['_id'] || 'mock-id-' + Math.random().toString(36).substr(2, 9);
    this.save = mockSave.mockResolvedValue({ ...data, _id: this._id });
    this.populate = jest.fn().mockReturnThis();
    this.toObject = jest.fn().mockReturnValue({ ...data, _id: this._id });
  }

  const MockModel = MockModelConstructor as unknown as MockModel<T>;

  // Static methods - return thenable queries
  MockModel.find = jest.fn().mockImplementation(() => createMockQuery([]));
  MockModel.findOne = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.findById = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.findByIdAndUpdate = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.findByIdAndDelete = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.findOneAndUpdate = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.findOneAndDelete = jest.fn().mockImplementation(() => createMockQuery(null));
  MockModel.create = jest.fn().mockResolvedValue({});
  MockModel.countDocuments = jest.fn().mockImplementation(() => createMockQuery(0));
  MockModel.aggregate = jest.fn().mockImplementation(() => createMockQuery([]));

  return MockModel;
}

// Helper to reset all mocks on a model
export function resetMockModel(model: MockModel): void {
  model.find.mockClear();
  model.findOne.mockClear();
  model.findById.mockClear();
  model.findByIdAndUpdate.mockClear();
  model.findByIdAndDelete.mockClear();
  model.findOneAndUpdate.mockClear();
  model.findOneAndDelete.mockClear();
  model.create.mockClear();
  model.countDocuments.mockClear();
  model.aggregate.mockClear();
}

// Helper functions to configure mock responses
export function configureMockFind<T>(model: MockModel<T>, data: T[]): void {
  model.find.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindOne<T>(model: MockModel<T>, data: T | null): void {
  model.findOne.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindById<T>(model: MockModel<T>, data: T | null): void {
  model.findById.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindByIdAndUpdate<T>(model: MockModel<T>, data: T | null): void {
  model.findByIdAndUpdate.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindByIdAndDelete<T>(model: MockModel<T>, data: T | null): void {
  model.findByIdAndDelete.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindOneAndUpdate<T>(model: MockModel<T>, data: T | null): void {
  model.findOneAndUpdate.mockImplementation(() => createMockQuery(data));
}

export function configureMockFindOneAndDelete<T>(model: MockModel<T>, data: T | null): void {
  model.findOneAndDelete.mockImplementation(() => createMockQuery(data));
}

export function configureMockCountDocuments(model: MockModel, count: number): void {
  model.countDocuments.mockImplementation(() => createMockQuery(count));
}

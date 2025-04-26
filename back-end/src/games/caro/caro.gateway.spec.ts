import { Test, TestingModule } from '@nestjs/testing';
import { CaroGateway } from './caro.gateway';

describe('CaroGateway', () => {
  let gateway: CaroGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaroGateway],
    }).compile();

    gateway = module.get<CaroGateway>(CaroGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

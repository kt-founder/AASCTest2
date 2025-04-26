import { Test, TestingModule } from '@nestjs/testing';
import { CaroController } from './caro.controller';

describe('CaroController', () => {
  let controller: CaroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaroController],
    }).compile();

    controller = module.get<CaroController>(CaroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

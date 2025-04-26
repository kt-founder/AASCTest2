import { Test, TestingModule } from '@nestjs/testing';
import { CaroService } from './caro.service';

describe('CaroService', () => {
  let service: CaroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaroService],
    }).compile();

    service = module.get<CaroService>(CaroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

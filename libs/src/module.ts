import { Global, Module, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  LocalizationAsyncOptions,
  LocalizationAsyncOptionsFactory,
  LocalizationOptions,
} from './interfaces';
import { CONFIG_OPTIONS } from './constants';
import { Language } from './services';

@Global()
@Module({})
export class LocalizationModule {
  /**
   * Register options
   * @param options
   */
  static register(options: LocalizationOptions): DynamicModule {
    return {
      module: LocalizationModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        Language,
      ],
      exports: [Language],
    };
  }

  /**
   * Register Async Options
   */
  static registerAsync(options: LocalizationAsyncOptions): DynamicModule {
    return {
      module: LocalizationModule,
      imports: [],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        Language,
        this.createQueueOptionsProvider(options),
      ],
    };
  }

  private static createQueueOptionsProvider(
    options: LocalizationAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<LocalizationOptions>,
    ];

    return {
      provide: CONFIG_OPTIONS,
      useFactory: async (optionsFactory: LocalizationAsyncOptionsFactory) =>
        await optionsFactory.createLocalizationOptions(),
      inject,
    };
  }
}

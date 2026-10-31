import { Global, Module, DynamicModule, Provider, Type } from "@nestjs/common";
import {
  LocalizationAsyncOptions,
  LocalizationAsyncOptionsFactory,
  LocalizationOptions,
} from "./interfaces";
import { CONFIG_OPTIONS } from "./constants";
import { LocalizationService } from "./services";

@Global()
@Module({ imports: [], providers: [] })
export class LocalizationModule {
  /**
   * Register options
   * @param options
   */
  static register(options: LocalizationOptions): DynamicModule {
    return {
      module: LocalizationModule,
      providers: [
        { provide: CONFIG_OPTIONS, useValue: options },
        LocalizationService,
      ],
      exports: [LocalizationService],
    };
  }

  /**
   * Register Async Options
   */
  static registerAsync(options: LocalizationAsyncOptions): DynamicModule {
    return {
      module: LocalizationModule,
      imports: [...(options.imports || [])],
      providers: [
        LocalizationService,
        this.createLocalizationOptionsProvider(options),
        ...(options.useClass ? [{ provide: options.useClass, useClass: options.useClass }] : []),
      ],
      exports: [LocalizationService],
    };
  }

  private static createLocalizationOptionsProvider(
    options: LocalizationAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<LocalizationAsyncOptionsFactory>,
    ];

    return {
      provide: CONFIG_OPTIONS,
      useFactory: async (optionsFactory: LocalizationAsyncOptionsFactory) =>
        await optionsFactory.createLocalizationOptions(),
      inject,
    };
  }
}

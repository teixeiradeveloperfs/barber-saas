import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomerAuthController } from './customer-auth.controller.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CustomerGuard, OptionalCustomerGuard } from './customer.guard.js';

@Global()
@Module({
  // Segredo vai por chamada (CUSTOMER_JWT_SECRET), separado do painel.
  imports: [JwtModule.register({})],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerGuard, OptionalCustomerGuard],
  exports: [CustomerAuthService, CustomerGuard, OptionalCustomerGuard],
})
export class CustomersModule {}

import { Body, Controller, Post, Logger } from '@nestjs/common';
import { PasswordResetService } from '@auth/password-reset/password-reset.service';
import { RequestResetPasswordDto } from '../dto/request-reset-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password-dto';

import { Public } from '@common/dicorators';

@Controller('password-reset')
export class PasswordResetController {
    private readonly logger = new Logger(PasswordResetController.name);

    constructor(private readonly passwordResetService: PasswordResetService) {}

    @Public()
    @Post('request')
    async requestPasswordReset(@Body() requestDto: RequestResetPasswordDto) {
        this.logger.log('Password reset request received');
        try {
            const result = await this.passwordResetService.requestPasswordReset(requestDto);
            this.logger.log(`Password reset link sent to: ${requestDto.email}`);
            return result;
        } catch (error) {
            this.logger.error(`Error occurred while processing reset request for: ${requestDto.email}`, error.stack);
            throw error;
        }
    }
    @Public()
    @Post('reset')
    async resetPassword(@Body() resetDto: ResetPasswordDto) {
        this.logger.log('Password reset received');
        try {
            const result = await this.passwordResetService.resetPassword(resetDto);
            this.logger.log(`Password successfully reset for token: ${resetDto.token}`);
            return result;
        } catch (error) {
            this.logger.error(`Error occurred while resetting password for token: ${resetDto.token}`, error.stack);
            throw error;
        }
    }
}

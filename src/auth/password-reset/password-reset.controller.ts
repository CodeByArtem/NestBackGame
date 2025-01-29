import { Body, Controller, Post, Logger } from '@nestjs/common';
import { Public } from '@common/dicorators';
import { PasswordResetService } from './password-reset.service';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestResetPasswordDto } from '@auth/dto/request-reset-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password-dto';
@ApiTags('Password-reset')
@Controller('password-reset')
export class PasswordResetController {
    private readonly logger = new Logger(PasswordResetController.name);

    constructor(private readonly passwordResetService: PasswordResetService) {}

    @Public()
    @Post('request')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({
        status: 200,
        description: 'Password reset link sent successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid email or request format.',
    })
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
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({
        status: 200,
        description: 'Password successfully reset.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid token or request format.',
    })
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

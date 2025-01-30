import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Tokens } from './interfaces';
import { Cookie, Public, UserAgent } from '@common/dicorators';
import { UserResponse } from '@user/response';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { GoogleGuard } from '@auth/guard/google.guard';
import { handleTimeoutAndErrors } from '@common/helpers';
import { map, mergeMap } from 'rxjs';
import { YandexGuard } from '@auth/guard/yandex.guard';
import { Provider } from '@prisma/client';

const REFRESH_TOKEN = 'refreshtoken';

@Public()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User successfully registered', type: UserResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.authService.register(dto);
        if (!user) {
            throw new BadRequestException(`Cannot register user with data: ${JSON.stringify(dto)}`);
        }
        return new UserResponse(user);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user and get access tokens' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 201, description: 'Logged in successfully' })
    @ApiResponse({ status: 400, description: 'Invalid login data' })
    async login(@Body() dto: LoginDto, @Res() res: Response, @UserAgent() agent: string) {
        const tokens = await this.authService.login(dto, agent);
        if (!tokens) {
            throw new BadRequestException(`Unable to login with the provided data: ${JSON.stringify(dto)}`);
        }
        this.setRefreshTokenToCookies(tokens, res);
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiCookieAuth()
    @ApiResponse({ status: 200, description: 'User logged out' })
    async logout(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response) {
        if (!refreshToken) {
            res.sendStatus(HttpStatus.OK);
            return;
        }
        await this.authService.deleteRefreshToken(refreshToken);
        res.cookie(REFRESH_TOKEN, '', {
            httpOnly: true,
            secure: true,
            expires: new Date(),
        });
        res.sendStatus(HttpStatus.OK);
    }

    @Get('refresh-tokens')
    @ApiOperation({ summary: 'Refresh authentication tokens' })
    @ApiCookieAuth()
    @ApiResponse({ status: 200, description: 'Tokens refreshed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async refreshTokens(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response, @UserAgent() agent: string) {
        if (!refreshToken) {
            throw new UnauthorizedException();
        }
        const tokens = await this.authService.refreshTokens(refreshToken, agent);
        if (!tokens) {
            throw new UnauthorizedException();
        }
        this.setRefreshTokenToCookies(tokens, res);
    }

    private setRefreshTokenToCookies(tokens: Tokens, res: Response) {
        if (!tokens) {
            throw new UnauthorizedException();
        }
        res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(tokens.refreshToken.exp),
            secure: this.configService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });
        res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
    }

    @UseGuards(GoogleGuard)
    @Get('google')
    @ApiOperation({ summary: 'Google authentication' })
    googleAuth() {}

    @UseGuards(GoogleGuard)
    @Get('google/callback')
    @ApiOperation({ summary: 'Google authentication callback' })
    @ApiQuery({ name: 'token', required: true })
    googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:3000/api/auth/success-google?token=${token}`);
    }

    @Get('success-google')
    @ApiOperation({ summary: 'Handle success after Google authentication' })
    @ApiQuery({ name: 'token', required: true })
    successGoogle(@Query('token') token: string, @UserAgent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`).pipe(
            mergeMap(({ data: { email } }) => this.authService.providerAuth(email, agent, Provider.GOOGLE)),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }

    @UseGuards(YandexGuard)
    @Get('yandex')
    @ApiOperation({ summary: 'Yandex authentication' })
    yandexAuth() {}

    @UseGuards(YandexGuard)
    @Get('yandex/callback')
    @ApiOperation({ summary: 'Yandex authentication callback' })
    @ApiQuery({ name: 'token', required: true })
    yandexAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:3000/api/auth/success-yandex?token=${token}`);
    }

    @Get('success-yandex')
    @ApiOperation({ summary: 'Handle success after Yandex authentication' })
    @ApiQuery({ name: 'token', required: true })
    successYandex(@Query('token') token: string, @UserAgent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://login.yandex.ru/info?format=json&oauth_token=${token}`).pipe(
            mergeMap(({ data: { default_email } }) =>
                this.authService.providerAuth(default_email, agent, Provider.YANDEX),
            ),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }
}
// end
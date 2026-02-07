import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService, SendMessageDto } from './chat.service';
import { RoomStatus } from './schema/chat-room.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';

class GetMessagesQueryDto {
  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  before?: string;
}

class MarkReadDto {
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];
}

class SendMessageBodyDto implements SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: any;

  @IsOptional()
  attachment?: any;

  @IsOptional()
  location?: any;
}

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ status: 200, description: 'List of chat rooms' })
  async getRooms(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: RoomStatus,
  ) {
    return this.chatService.getUserRooms(user.userId, status);
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get room details' })
  @ApiResponse({ status: 200, description: 'Room details' })
  async getRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
  ) {
    return this.chatService.getRoom(roomId, user.userId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get room messages' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(
      roomId,
      user.userId,
      query.limit || 50,
      query.before,
    );
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message (fallback for non-WebSocket)' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageBodyDto,
  ) {
    return this.chatService.sendMessage(roomId, user.userId, dto);
  }

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 204, description: 'Messages marked as read' })
  async markRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
    @Body() dto: MarkReadDto,
  ) {
    await this.chatService.markAsRead(roomId, user.userId, dto.messageIds);
  }

  @Post('rooms/:roomId/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all messages as read' })
  @ApiResponse({ status: 204, description: 'All messages marked as read' })
  async markAllRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.markAllAsRead(roomId, user.userId);
  }

  @Post('rooms/:roomId/archive')
  @ApiOperation({ summary: 'Archive a chat room' })
  @ApiResponse({ status: 200, description: 'Room archived' })
  async archiveRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
  ) {
    return this.chatService.archiveRoom(roomId, user.userId);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(messageId, user.userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.chatService.getUnreadCount(user.userId);
    return { count };
  }

  @Get('service/:serviceRequestId')
  @ApiOperation({ summary: 'Get chat room for a service request' })
  @ApiResponse({ status: 200, description: 'Room for service or null' })
  async getRoomByService(
    @Param('serviceRequestId') serviceRequestId: string,
  ) {
    return this.chatService.getRoomByServiceRequest(serviceRequestId);
  }

  @Post('service/:serviceRequestId/room')
  @ApiOperation({ summary: 'Get or create chat room for a service request' })
  @ApiResponse({ status: 201, description: 'Chat room created or returned' })
  async getOrCreateServiceRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Param('serviceRequestId') serviceRequestId: string,
  ) {
    return this.chatService.getOrCreateRoomForService(serviceRequestId, user.userId);
  }
}

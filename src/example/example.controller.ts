// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Query,
  Route,
  SuccessResponse,
} from "tsoa";
import type { User } from "./example";
import { UsersService } from "./example.service";
import type { UserCreationParams } from "./example.service";

@Route("/")
export class ExampleController extends Controller {
  @Get("/hello")
  public async getRoot(): Promise<string> {
    return "Hello World";
  }

  @Get("/users/{userId}")
  public async getUser(
    @Path() userId: number,
    @Query() name?: string,
  ): Promise<User> {
    return new UsersService().get(userId, name);
  }

  @SuccessResponse("201", "Created") // Custom success response
  @Post("/users")
  public async createUser(
    @Body() requestBody: UserCreationParams,
  ): Promise<void> {
    this.setStatus(201); // set return status 201
    new UsersService().create(requestBody);
    return;
  }
}

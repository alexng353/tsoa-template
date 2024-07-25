// import { Request  as ExpressRequest} from "express";
import {
  Get,
  Route,
  Security,
  // Request
} from "tsoa";

@Route("/example")
export class SecureController {
  @Security("jwt", ["admin"])
  @Get("/auth-test")
  public async userInfo(): Promise<string> {
    return "You are an admin!";
  }
}

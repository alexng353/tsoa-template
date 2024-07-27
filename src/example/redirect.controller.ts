import { NController } from "@lib/ncontroller";
import { Get, Route } from "tsoa";

@Route("/test/redirect")
export class RedirectController extends NController {
  @Get("/")
  public async goredirect() {
    this.redirect("https://google.com");
    return;
  }
}

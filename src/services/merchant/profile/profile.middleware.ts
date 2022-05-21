import { Joi } from "celebrate";
import { autoInjectable } from "tsyringe";
@autoInjectable()
export default class ProfileMiddleware {
  public readonly updateSchema = Joi.object({
    name: Joi.string().min(0),
    email: Joi.string().email(),
  });
}

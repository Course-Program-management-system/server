import { Joi } from "celebrate";
import { autoInjectable } from "tsyringe";
@autoInjectable()
export default class ProgramMiddleware {
  public readonly createSchema = Joi.object({
    name: Joi.string().required().min(2),
    programOutcomes: Joi.array().items({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
    programSpecificOutcomes: Joi.array().items({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
  });
  public readonly updateSchema = Joi.object({
    name: Joi.string().min(2),
    programOutcomes: Joi.array().items({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
    programSpecificOutcomes: Joi.array().items({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
  });
}

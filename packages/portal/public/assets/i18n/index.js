import { login_en } from "./login";
import {tutor_en, tutor_es} from "./tutor";
import { tutor_inquiry_en } from "./tutor_inquiry";
import { common_en } from "./common";
import { categories_en } from "./categories";
import { cms_en } from "./cms";
import { mail_config_en } from "./mail_config";
import { system_config_en } from "./system_configuration";
import { faq_en } from "./faq";
import { program_es } from "./program";
import { learner_en } from "./learner";
import { inquires_en } from "./inquires";
import { noti_config } from "./noti_config";
import { transaction_en } from "./transaction";
import { component_categories_en } from "./component_categories";
import { component_sub_categories_en } from "./component_sub_categories";
import { manage_component_en } from "./manage_component";
import {batches_en} from "./batches";

export const resources = {
    en: {
      translation: {
          "welcome": {
            "title" : "Welcome to Learning"
          },
          "greeting": "Hello, {{name}}!",
          "login" : login_en,
          "common" : common_en,
          "tutor" : tutor_en,
          "learner" : learner_en,
          "tutor_inquiry" : tutor_inquiry_en,
          "categories" : categories_en,
          "cms" : cms_en,
          "mail_config" : mail_config_en,
          "system_config" : system_config_en,
          "faq" : faq_en,
          "program" : program_es,
          "inquires":inquires_en,
          "noti_config" : noti_config,
          "transaction" : transaction_en,
          "component_categories" : component_categories_en,
          "component_sub_categories" : component_sub_categories_en,
          'manage_component': manage_component_en,
          "batches" : batches_en,


        },
    },
    es: {
      translation: {
          "welcome": {
            'title' : "Bienvenida al aprendizaje"
          },
          "greeting": "Hola, {{name}}!"
          
        },
    },
  };
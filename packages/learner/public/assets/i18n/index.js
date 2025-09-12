import { common_es } from "./common";
import { login_en } from "./login";
import {profile_en, profile_es} from "./profile";
import { program_es } from "./program";
import { faq_en } from "./faq";
import { calender_es } from "./calender";
import {event_es} from "./eventLogin";


export const resources = {
    en: {
      translation: {
          "welcome": {
            "title" : "Welcome to Learning"
          },
          "greeting": "Hello, {{name}}!",
          "login" : login_en,
          "common" : common_es,
          "profile" : profile_en,
          "program" : program_es,
          "faq" : faq_en,
          "live_calender" : calender_es,
          "eventLogin":event_es,
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
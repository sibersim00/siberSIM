export const regex = {
    //Regex Pattern
    emailRegex : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    numberRegex: /^\d+$/,
    alphaNumericRegex: /^[a-zA-Z0-9]+$/,
    alpaRegex: /^[a-zA-Z]+$/,
    alphaHyphenSpacesRegex: /^[a-zA-Z\s-]*$/,
    videoUrlRegex : /^(?:(?:https?:\/\/)?(?:www\.)?)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})|(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    whiteSpace : /(?!\W)\S+/,
    charCount : 500
  };

  export const error = {
    //Error Messages
    required : 'Required',
    invalid : "Invalid",
    onlyNumeric: 'Invalid : Only Numeric',
    onlyAlphaNumeric: 'Invalid : Only Alphanumeric',
    onlyAlphabet: 'Invalid : Only Alphabet',
    onlyAlphaHyphenSpace : "Invalid : Only alphabets, hyphens, and spaces",
    onlyValidUrl : "Invalid : Only Vimeo / Youtube url allowed",
    only255Words : "Must be less than 255 characters",
  };


  
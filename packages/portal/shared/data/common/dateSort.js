const dateComparator = (date1, date2) => {
    const parsedDate1 = new Date(date1);
    const parsedDate2 = new Date(date2);
  
    const day1 = parsedDate1.getDate();
    const month1 = parsedDate1.getMonth();
    const year1 = parsedDate1.getFullYear();
  
    const day2 = parsedDate2.getDate();
    const month2 = parsedDate2.getMonth();
    const year2 = parsedDate2.getFullYear();
  
    // Compare years first
    if (year1 !== year2) {
      return year1 - year2;
    }
  
    // If years are the same, compare months
    if (month1 !== month2) {
      return month1 - month2;
    }
  
    // If months are the same, compare days
    return day1 - day2;
  };
  
  export default dateComparator;
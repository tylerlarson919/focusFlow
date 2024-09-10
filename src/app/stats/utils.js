// utils.js

export const convertLengthToMinutes = (length) => {
  const regex = /(\d+)h?\s*(\d+)m?/;
  const matches = length.match(regex);
  if (!matches) return 0;

  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  return hours * 60 + minutes;
};

export const parseDate = (timestamp) => {
  if (!timestamp) {
    console.error('Timestamp is undefined or null');
    return null;
  }

  try {
    if (timestamp.toDate) {
      return timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid date string:', timestamp);
        return null;
      }
      return parsedDate;
    }
    return null;
  } catch (error) {
    console.error(`Error converting timestamp: ${timestamp}`, error);
    return null;
  }
};



export const sortDataByDate = (data) => {
  console.log('Sorting data by date:', data);
  return data.sort((a, b) => {
    const dateA = parseDate(a.name);
    const dateB = parseDate(b.name);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
};

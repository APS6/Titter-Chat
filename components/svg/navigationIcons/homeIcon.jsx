export default function HomeIcon({ active }) {
  if (active) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.5 9.25V20.5H14.5V14V13.5H14H10H9.5V14V20.5H4.5V9.25L12 3.625L19.5 9.25Z"
          fill="white"
        />
      </svg>
    );
  } else {
    return (
      <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.5 9.25V20.5h-5v-7h-5v7h-5V9.25L12 3.625l7.5 5.625z"
          stroke="#fff"
        />
      </svg>
    );
  }
}



export default function Loader() {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
    width="2rem"
    height="2rem"
    viewBox="0 0 24 24"
  >
    <circle cx="4" cy="12" r="3" fill="currentColor">
      <animate
        id="svgSpinners3DotsFade0"
        fill="freeze"
        attributeName="opacity"
        begin="0;svgSpinners3DotsFade1.end-0.25s"
        dur="0.75s"
        values="1;.2"
      ></animate>
    </circle>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".4">
      <animate
        fill="freeze"
        attributeName="opacity"
        begin="svgSpinners3DotsFade0.begin+0.15s"
        dur="0.75s"
        values="1;.2"
      ></animate>
    </circle>
    <circle cx="20" cy="12" r="3" fill="currentColor" opacity=".3">
      <animate
        id="svgSpinners3DotsFade1"
        fill="freeze"
        attributeName="opacity"
        begin="svgSpinners3DotsFade0.begin+0.3s"
        dur="0.75s"
        values="1;.2"
      ></animate>
    </circle>
  </svg>
  )
}

export function EditorHeading({ icon: Icon, children }) {
  return (
    <h2 className="editor-heading">
      <span className="editor-heading-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      {children}
    </h2>
  )
}

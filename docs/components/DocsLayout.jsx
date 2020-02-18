import Link from "next/link";
import css from "../styles/main.less";

function SidebarItem(props) {
  const { href, label, children } = props;
  return (
    <li>
      <Link className={css.sidebaritem} href={href}>
        <a>{label}</a>
      </Link>
      {children && <ul>{children}</ul>}
    </li>
  );
}
export default function DocsLayout(props) {
  return (
    <div className={css.global}>
      <div className={css.main}>
        <div className={css.sidebar}>
          <h2>
            <Link href="/">
              <a>Oak</a>
            </Link>
          </h2>
          <ul>
            <SidebarItem label="Introduction" href="/introduction" />
            <SidebarItem label="Samples" href="/samples" />
            <SidebarItem label="Guides" href="/guides" />
            <SidebarItem label="API Reference" href="/reference">
              <SidebarItem label="CLI Reference" href="/reference/cli" />
              <SidebarItem
                label="Standard  Library Reference"
                href="/reference/stdlib"
              />
            </SidebarItem>
          </ul>
        </div>
        <div>
          <div className={css.container}>{props.children}</div>
        </div>
      </div>
    </div>
  );
}

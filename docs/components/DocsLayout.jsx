import Link from "next/link";
import css from "../styles/main.less";

const SidebarItem = props => (
  <li>
    <Link className={css.sidebaritem} href={props.href}>
      {props.label}
    </Link>
  </li>
);
export default function DocsLayout(props) {
  return (
    <div className={css.global}>
      <div className={css.main}>
        <div className={css.sidebar}>
          <h2>
            <Link href="/">Oak</Link>
          </h2>
          <ul>
            <SidebarItem label="Introduction" href="/introduction" />
            <SidebarItem label="Samples" href="/samples" />
            <SidebarItem label="Guides" href="/guides" />
            <SidebarItem label="API Reference" href="/reference" />
          </ul>
        </div>
        <div>
          <div className={css.container}>{props.children}</div>
        </div>
      </div>
    </div>
  );
}

import Head from "next/head";
import Link from "next/link";

const layoutStyle = {
  margin: 20,
  padding: 20,
  border: "1px solid #DDD"
};
const SidebarItem = props => (
  <li>
    <Link href={props.href}>{props.label}</Link>
  </li>
);
export default function DocsLayout(props) {
  return (
    <div style={layoutStyle}>
      <Head>
        <link />
      </Head>
      <style global jsx>{`
        .main {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 10rem auto;
        }
        .sidebar {
          border-right: 1px #ccc;
        }
      `}</style>
      <div className="main">
        <div className="sidebar">
          <ul>
            <SidebarItem label="Introduction" href="/introduction" />
            <ul>
              <li>asdf</li>
            </ul>
            <SidebarItem label="Samples" href="/samples" />
            <SidebarItem label="Guides" href="/guides" />
            <SidebarItem label="API Reference" href="/reference" />
          </ul>
        </div>
        <div className="container">{props.children}</div>
      </div>
    </div>
  );
}

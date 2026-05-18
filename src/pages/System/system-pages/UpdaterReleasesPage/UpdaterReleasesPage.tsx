import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button, Collapse, Tag } from "antd";
import { Download, FolderArchive, RefreshCw } from "lucide-react";
import { getUpdaterReleases } from "../../../../api/updaterReleases";
import { getPageHeaderIcon } from "../../../../config/route-icons";
import { useUser } from "../../../../hooks/useUser";
import type {
  UpdaterReleaseChannel,
  UpdaterReleaseFile,
  UpdaterReleaseList,
  UpdaterReleaseVersion,
} from "../../../../types/updaterRelease";
import "./UpdaterReleasesPage.scss";

const QUERY_KEY = ["updater-releases"] as const;

export default function UpdaterReleasesPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const isAdmin = user?.role?.key === "ADMIN";
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getUpdaterReleases,
    retry: false,
    enabled: isAdmin,
  });

  if (isUserLoading) return <div>Загрузка…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <UpdaterReleasesView query={query} />;
}

function UpdaterReleasesView({ query }: ViewProps) {
  const headerIcon = getPageHeaderIcon("/system/updater-releases");
  return (
    <div className="updater-releases-page">
      <PageHeader icon={headerIcon} onRefresh={() => query.refetch()} refreshing={query.isFetching} />
      <Intro publicBaseUrl={query.data?.publicBaseUrl} />
      {query.isLoading ? <div>Загрузка…</div> : null}
      {query.isError ? <div>Нет доступа или ошибка загрузки</div> : null}
      {query.data ? <ReleaseContent data={query.data} /> : null}
    </div>
  );
}

function PageHeader({ icon, onRefresh, refreshing }: HeaderProps) {
  return (
    <div className="updater-releases-header">
      <div className="page-header__title">
        {icon}
        <h2>Updater releases</h2>
      </div>
      <Button icon={<RefreshCw size={16} />} loading={refreshing} onClick={onRefresh}>
        Обновить
      </Button>
    </div>
  );
}

function Intro({ publicBaseUrl }: { publicBaseUrl?: string }) {
  return (
    <p className="updater-releases-intro">
      Файлы берутся из серверного release-хранилища updater. Скачивание идёт по
      публичным ссылкам {publicBaseUrl ? <code>{publicBaseUrl}</code> : "updater"}.
    </p>
  );
}

function ChannelList({ channels }: { channels: UpdaterReleaseChannel[] }) {
  if (!channels.length) return <div className="empty-state">Release-файлы не найдены.</div>;
  return <Collapse items={channels.map(channelItem)} defaultActiveKey={channels.map((c) => c.channel)} />;
}

function ReleaseContent({ data }: { data: UpdaterReleaseList }) {
  if (!data.storage.available) return <MissingStorage storageRoot={data.storage.root} />;
  return <ChannelList channels={data.channels} />;
}

function MissingStorage({ storageRoot }: { storageRoot: string }) {
  return (
    <div className="empty-state">
      Backend не видит release-хранилище <code>{storageRoot}</code>. Проверь `UPDATER_ROOT`
      на машине, где запущен API.
    </div>
  );
}

function channelItem(channel: UpdaterReleaseChannel) {
  return {
    key: channel.channel,
    label: <ChannelTitle channel={channel} />,
    children: <ChannelDetails channel={channel} />,
  };
}

function ChannelTitle({ channel }: { channel: UpdaterReleaseChannel }) {
  return (
    <div className="channel-title">
      <span>{channel.channel}</span>
      <Tag>{channel.fileCount} файлов</Tag>
      <Tag>{formatBytes(channel.totalSizeBytes)}</Tag>
    </div>
  );
}

function ChannelDetails({ channel }: { channel: UpdaterReleaseChannel }) {
  return (
    <div className="channel-details">
      <FileSection title="Файлы канала" files={channel.rootFiles} />
      {channel.versions.map((version) => <VersionSection key={version.version} version={version} />)}
    </div>
  );
}

function VersionSection({ version }: { version: UpdaterReleaseVersion }) {
  return (
    <div className="version-section">
      <div className="version-title">
        <FolderArchive size={18} />
        <span>{version.version}</span>
        <Tag>{version.fileCount} файлов</Tag>
        <Tag>{formatBytes(version.totalSizeBytes)}</Tag>
      </div>
      <FileList files={version.files} />
    </div>
  );
}

function FileSection({ title, files }: FileSectionProps) {
  if (!files.length) return null;
  return (
    <div className="version-section">
      <div className="version-title">{title}</div>
      <FileList files={files} />
    </div>
  );
}

function FileList({ files }: { files: UpdaterReleaseFile[] }) {
  return (
    <div className="release-file-list">
      {files.map((file) => <ReleaseFileRow key={file.relativePath} file={file} />)}
    </div>
  );
}

function ReleaseFileRow({ file }: { file: UpdaterReleaseFile }) {
  return (
    <div className="release-file-row">
      <div className="release-file-main">
        <div className="release-file-name">{file.name}</div>
        <div className="release-file-meta">
          {formatBytes(file.sizeBytes)} · {formatDate(file.modifiedAt)}
        </div>
      </div>
      <a className="download-link" href={file.downloadUrl} target="_blank" rel="noreferrer">
        <Download size={16} />
        Скачать
      </a>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface ViewProps {
  query: UseQueryResult<UpdaterReleaseList>;
}

interface HeaderProps {
  icon: ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
}

interface FileSectionProps {
  title: string;
  files: UpdaterReleaseFile[];
}

import { Spinner } from "@/components/ui/spinner"

export default function GroupLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner label="載入帳本資料中..." />
    </div>
  )
}

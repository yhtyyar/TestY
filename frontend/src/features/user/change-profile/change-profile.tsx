import { useAppDispatch } from "app/hooks"

import { showEditProfileModal } from "entities/user/model"

import FilterPlusIcon from "shared/assets/yi-icons/filter-plus.svg?react"
import { Button } from "shared/ui"

import { EditProfileModal } from "widgets/user"

export const ChangeProfile = () => {
  const dispatch = useAppDispatch()

  const handleClickEdit = () => {
    dispatch(showEditProfileModal())
  }

  return (
    <>
      <Button
        id="edit-profile"
        color="ghost"
        onClick={handleClickEdit}
        shape="square"
        size="m"
        style={{ width: 24, height: 24 }}
      >
        <FilterPlusIcon width={20} height={20} />
      </Button>
      <EditProfileModal />
    </>
  )
}

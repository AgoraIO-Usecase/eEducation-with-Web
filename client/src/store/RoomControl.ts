import { Map } from "immutable";
import {createLogger, EasyState} from '../utils'

const roomStoreLog = createLogger('[RoomStore]', 'white', '#0050b3', true)

type UserInfo = {
  name: string;
  role: ClientRole;
  uid: number;
  streamId: number;
};

export default EasyState({
  state: {
    channelAttr: Map<string, string|number>(),
    studentList: Map<string, any>(),
    teacherList: Map<string, any>(),
    messageList: [] as Array<{uid: string, content: string, username: string, local: boolean}>
  },

  actions: {
    addMember(state, { members }) {
      let tempStudentsList = state.studentList;
      let tempTeacherList = state.teacherList;
      if (members instanceof Array) {
        for (let item of members) {
          if (Number(item.role) === 1) {
            // student
            tempStudentsList = tempStudentsList.set(item.uid, {
              ...item,
              video: true,
              audio: true,
              chat: true
            });
          }
          if (Number(item.role) === 2) {
            // teacher
            tempTeacherList = tempTeacherList.set(item.uid, item);
          }
        }
      } else {
        if(members) {
          if (Number(members.role) === 1) {
            // student
            tempStudentsList = tempStudentsList.set(members.uid, {
              ...members,
              video: true,
              audio: true,
              chat: true
            });
          }
          if (Number(members.role)=== 2) {
            // teacher
            tempTeacherList = tempTeacherList.set(members.uid, members);
          }
        }
      }
      return {
        channelAttr: state.channelAttr,
        messageList: state.messageList,
        teacherList: tempTeacherList,
        studentList: tempStudentsList
      };
    },

    updateMember(state, { uid, attr}) {
      let tempStudentsList = state.studentList;
      let tempTeacherList = state.teacherList;
      if (tempStudentsList.has(uid)) {
        tempStudentsList = tempStudentsList.update(uid, value => Object.assign({}, value, attr))
      } else if (tempTeacherList.has(uid)) {
        tempTeacherList = tempTeacherList.update(uid, value => Object.assign({}, value, attr))
      }
      return {
        channelAttr: state.channelAttr,
        messageList: state.messageList,
        teacherList: tempTeacherList,
        studentList: tempStudentsList
      };
    },

    removeMember(state, { uid }) {
      let tempStudentsList = state.studentList.delete(uid);
      let tempTeacherList = state.teacherList.delete(uid);
      return {
        channelAttr: state.channelAttr,
        messageList: state.messageList,
        teacherList: tempTeacherList,
        studentList: tempStudentsList
      }
    },

    updateChannelAttr(state, {channelAttr}) {
      return {
        studentList: state.studentList,
        messageList: state.messageList,
        teacherList: state.teacherList,
        channelAttr: state.channelAttr.merge(channelAttr as typeof state.channelAttr)
      }
    },

    updateUserAttr(state, {uid, userAttr}) {
      let tempStudentsList = state.studentList;
      let tempTeacherList = state.teacherList;
      if (tempStudentsList.has(uid)) {
        tempStudentsList = tempStudentsList.set(uid, userAttr)
      } else if (tempTeacherList.has(uid)) {
        tempTeacherList = tempTeacherList.set(uid, userAttr)
      }
      return {
        channelAttr: state.channelAttr,
        messageList: state.messageList,
        teacherList: tempTeacherList,
        studentList: tempStudentsList
      }
    },

    addChannelMessage(state, {uid, content, local}) {
      const user = state.studentList.merge(state.teacherList).get(uid);
      let name = 'unknown'
      if (user) {
        name = user.name
      }
      return {
        channelAttr: state.channelAttr,
        messageList: state.messageList.concat([{
          uid: uid, content, username: name, local
        }]),
        teacherList: state.teacherList,
        studentList: state.studentList
      }
    }
  }
});

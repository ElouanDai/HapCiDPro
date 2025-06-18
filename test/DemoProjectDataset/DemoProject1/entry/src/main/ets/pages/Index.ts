//导入命名空间 (默认导出)
import promptAction from '@ohos.promptAction';
import media from '@ohos.multimedia.media';
//导入animator类 (默认导出) 得到animator的实例
//导入AnimatorResult接口
import animator, { AnimatorResult } from '@ohos.animator';
import Window from '@ohos.window';
class Index{
    // 类型为media命名空间中的接口
    private avPlayer: media.AVPlayer;
    render() {
        // 调用promptAction命名空间中的showToast方法
        promptAction.showToast({ message: "msg"});
        // 调用promptAction命名空间中的onrepeat属性
        promptAction.onrepeat = () => {
            console.info('promptAction repeat');
         };
        // 调用avPlayer成员变量的on方法
        this.avPlayer.on();
        // 调用Animator类的createAnimator方法
        let animatorA: AnimatorResult = animator.createAnimator({});
        // 调用AnimatorResult接口的finish方法
        animatorA.finish();
        // 调用AnimatorResult接口的onrepeat属性
        animatorA.onrepeat = () => {
           console.info('backAnimator repeat');
        };;
    }
    onWindowStageCreate(windowStage: Window.WindowStage) {
        windowStage.loadContent('testability/pages/Index', (err, data) => {
        });
    }
}


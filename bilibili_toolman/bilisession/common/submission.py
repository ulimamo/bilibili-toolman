# -*- coding: utf-8 -*-
class SubmissionVideos(list):
    """Container for all videos within a submission (P-arts)"""

    def extend(self, __iterable) -> None:
        for item in __iterable:
            self.append(item)

    def append(self, video) -> None:
        """Only Submissions or Dict (translated into Submission) will be appended to our list"""
        if isinstance(video, dict):
            # try to interpert it as a list of dictionaries sent by server
            with Submission() as submission:
                submission.title = video.get("title", "")
                submission.video_endpoint = video.get("filename", "")
                submission.video_duration = video.get("duration", 0)
                submission.bvid = video.get("bvid", "")
                submission.biz_id = video.get("cid", "")
                submission.aid = video.get("aid", "")
                submission.stat = video
                submission.parent = self
            return super().append(submission)
        elif isinstance(video, Submission):
            return super().append(video)
        else:
            raise Exception("Either a dict or a Submission object can be supplied.")

    @property
    def archive(self):
        """Dumps current videos as archvies that's to be the payload"""
        target = self if self else [self.parent]  # fallback to parent node
        return [
            {
                "filename": video.video_endpoint,
                "title": video.title,
                "desc": video.description,
                **({"cid": video.biz_id} if video.biz_id else {}),
            }
            for video in target
        ]

    def __init__(self, parent=None):
        """Initializes the list

        parent : Submission - Used as fallback value when theres no subvideos
        """
        self.parent = parent
        super().__init__()

    def __repr__(self) -> str:
        return f"<SubmissionVideos count={len(self)}>"


class Submission:
    """Generic type for a Submission"""

    """COPYRIGHT types"""
    COPYRIGHT_ORIGINAL = 1
    COPYRIGHT_REUPLOAD = 2
    """REPRINT types"""
    REPRINT_DISALLOWED = 1
    REPRINT_ALLOWED = 0
    """Copyright consts"""
    close_reply: bool = False
    close_danmu: bool = False
    """Access control parameters"""
    _description: str = ""

    @property
    def description(self):
        return self._description

    @description.setter
    def description(self, v):
        self._description = v or ""  # fallback

    """Description for the video"""
    title: str = ""
    """Title for the submission"""
    copyright: int = COPYRIGHT_REUPLOAD
    """Copyright type"""
    no_reprint: int = REPRINT_ALLOWED
    """Reupload allowance type"""
    source: str = ""
    """Reupload source"""
    thread: int = 0
    """Thread ID"""
    tags: list = None
    """Tags of video"""
    videos: SubmissionVideos = None
    """List of videos in submission"""
    _cover_url = ""

    @property
    def cover_url(self):
        """Cover image URL"""
        return self._cover_url

    @cover_url.setter
    def cover_url(self, value):
        # note : this will strip the HTTP prefix
        if value:
            self._cover_url = "//" + value.split("//")[-1]

    # region Per video attributes
    _video_filename = ""

    @property
    def video_endpoint(self):
        """Endpoint name"""
        return self._video_filename

    @video_endpoint.setter
    def video_endpoint(self, value):
        # note : this will strip the HTTP prefix
        self._video_filename = value.split("/")[-1].split(".")[0]

    biz_id = 0
    """a.k.a cid.for web apis"""
    bvid = ""
    """the new video ID"""
    aid = 0
    """another ID for web apis"""
    thread_name = ""
    """upload thread name i.e. typename"""
    parent_tname = ""
    """parent thread name"""
    stat = None
    """viewer status"""
    reject_reason = ""
    """rejection"""
    state = 0
    """status of video"""
    state_desc = ""
    """status but human readable"""
    video_duration = 0
    """duration of video"""
    desc_format_id = 0
    """description format IDs"""
    topic_id = 0
    """topic(?) ID"""
    topic_name = ""
    """topic(?) Name"""    
    _parent = None

    @property
    def parent(self):
        self._parent: Submission
        return self._parent

    @parent.setter
    def parent(self, v):
        self._parent = v

    """parent object. used for videos property"""
    # endregion
    def __init__(self, title="", desc="", video_endpoint="") -> None:
        self.tags = []  # creates new instance for mutables
        self.videos = SubmissionVideos(self)
        self.title = title
        self.description = desc
        self.video_endpoint = video_endpoint

    def __enter__(self):
        """Creates a new,empty submission"""
        return Submission()

    def __exit__(self, *args):
        pass

    @property
    def archive(self):
        """returns a dict containing all our info"""
        kv_pair = {
            "copyright": self.copyright,
            "videos": self.videos.archive,
            "source": self.source,
            "tid": int(self.thread),
            "title": self.title,
            "tag": ",".join(set(self.tags)),
            "desc_format_id": self.desc_format_id,
            "desc": self.description,
            # "up_close_reply": self.close_reply,
            # "up_close_danmu": self.close_danmu
            "no_reprint": self.no_reprint,
            "cover": self.cover_url,
            **({
                "topic_detail":{
                    "from_source":"arc.web.recommend", # let's leave it be for now
                    "from_topic_id" : int(self.topic_id)
                },
                "topic_id": int(self.topic_id)
            } if self.topic_id and self.topic_name else {})            
        }
        return kv_pair

    def __repr__(self) -> str:
        return '< bvid : "%s" , thread : %s , title : "%s", desc : "%s" , video_endpoint : "%s" >' % (
            self.bvid,
            self.thread,
            self.title,
            self.description,
            self.video_endpoint
            or ",".join([video.video_endpoint for video in self.videos]),
        )


def create_submission_by_arc(arc: dict):
    """Generates a `Submission` object via a `arc` dict"""
    with Submission() as submission:
        if "parent_tname" in arc:  # Web version only
            submission.parent_tname = arc["parent_tname"]
            submission.thread_name = arc["typename"]
        if "Archive" in arc:
            arc["archive"] = arc["Archive"]
        submission.stat = arc.get("archive",arc.get("stat"))
        submission.aid = submission.stat["aid"]
        submission.thread = submission.stat["tid"]
        submission.desc_format_id = submission.stat["desc_format_id"]
        submission.copyright = arc["archive"]["copyright"]
        submission.bvid = arc["archive"]["bvid"]
        submission.title = arc["archive"]["title"]
        submission.cover_url = arc["archive"]["cover"]
        submission.tags = arc["archive"]["tag"].split(",")
        submission.description = arc["archive"]["desc"]
        submission.source = arc["archive"]["source"]
        submission.state_desc = arc["archive"]["state_desc"]
        submission.state = arc["archive"]["state"]
        submission.reject_reason = arc["archive"]["reject_reason"]
        submission.no_reprint = arc["archive"]["no_reprint"]
        if "Videos" in arc:
            arc["videos"] = arc["Videos"]
        submission.videos.extend(arc["videos"])
        submission.topic_id = arc["archive"].get("topic_id",0)
        submission.topic_name = arc["archive"].get("topic_name","")
    return submission

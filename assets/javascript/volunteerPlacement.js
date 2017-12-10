/** volunteerPlacement.js
 * @author Brian Swartzfager
 */

$(document).ready(function() {

	$("#viewingOptionAll").change(function() {
		$(".volunteer").removeClass("hideElement");
	});

	$("#viewingOptionMatched").change(function() {
		showOnlyVolunteersForOpenGroups();
	});

	$("#instructionToggle").toggle(
		function() {
			$("#instructions").addClass("hideElement");
			$(this).text("Show instructions");
			return false;
		},
		function() {
			$("#instructions").removeClass("hideElement");
			$(this).text("Hide instructions");
			return false;
		}
	);



	$(".volList").sortable({
			connectWith: ['.memberList'],
			handle: '.profile',
			forceHelperSize: true//,
			//helper: function() { return $('<div style="width:100px;height:20px;background-color:blue;"><div/>')[0]; }
		});

	$(".memberList").sortable({
			//connectWith: ['.volList','.memberList'],
			connectWith: ['.volList'],
			handle: '.profile',
			receive: function(event, ui) {
				var $memList= $(this);
				/* Perform AJAX call to update the candidate's record with the id of the group they were placed in.
				 * If successful, execute the following code:
				 */
				$vacancyList= $memList.prev(".groupConsole").children(".vacancyListBlock").children(".vacancyList");
				updateGroupVacancies($memList,$vacancyList,ui.item,'subtract');

				//Have to add groupId to profile title
				ui.item.children(".profile").attr("title",$memList.attr("id"));

			},
			remove: function(event, ui) {
				var $memList= $(this);
				/* Perform AJAX call to remove the groupId from the candidate's record.
				 * If successful, execute the following code:
				 */
				$vacancyList= $memList.prev(".groupConsole").children(".vacancyListBlock").children(".vacancyList");
				updateGroupVacancies($memList,$vacancyList,ui.item,'add');
				//Have to remove groupId from profile title
				ui.item.children(".profile").attr("title","");
			},

		});


	$(".toggleGroupInfo").toggle(
		function() {
			var $img= $(this);
			$img.attr("src","assets/images/down.gif");
			$img.nextAll("div.groupInfo").removeClass("hideElement");
			if($("input[name='viewingOption']:checked").val()== "matched")
			{
				showOnlyVolunteersForOpenGroups();
			}
		},
		function() {
			var $img= $(this);
			$img.attr("src","assets/images/right.gif");
			$img.nextAll("div.groupInfo").addClass("hideElement");
			if($("input[name='viewingOption']:checked").val()== "matched")
			{
				showOnlyVolunteersForOpenGroups();
			}
		}
	);

	$(".toggleMemberView").toggle(
		function() {
			var $link= $(this);
			$(".groupInfo").children($link.attr("href")).children("li.member").removeClass("hideElement");
			$link.text("Hide current committee members");
			return false;
		},
		function() {
			var $link= $(this);
			$(".groupInfo").children($link.attr("href")).children("li.member").addClass("hideElement");
			$link.text("Show current committee members");
			return false;
		}
	);

	updateInitialView();

});  //End of document.ready


function updateInitialView() {
	/* NOTE: This function doesn't do anything in this demo (because the volunteer placements are not
	* saved/stored), but in the production version of this tool, it puts volunteers who were placed in a committee 
	* in a previous session into that committee.  Then it scans the groups for placed  volunteers and updates 
	* the vacancy counts and the vacancy status of the groups accordingly
	 */
	$.blockUI();
	placeVolunteers();
	updateVacancyStatus();
	$.unblockUI();
} //end of updateInitialView

function placeVolunteers() {
	$(".volList").children(".volunteer").children(".profile[title!='']").each(function(i) {
		var $profile= $(this);
		var $volunteer= $profile.parent(".volunteer");
		$newInstance= $volunteer.clone(true);
		$targetGroupList= $("#" + $profile.attr("title"));
		$targetGroupList.append($newInstance);
		$volunteer.remove();
	});

} //end of placeVolunteers

function updateVacancyStatus() {
	$(".vacancyList").children("li").each(function(i) {
		var $vacancyInstance= $(this);
		var conId= $vacancyInstance.attr("title");
		var currentCount= $vacancyInstance.children("span").text();

		$memberList= $vacancyInstance.parents(".groupInfo").children(".memberList");
		$memberList.children(".volunteer").each(function(j) {
			var $volunteer= $(this);
			if($volunteer.hasClass(conId))
			{
				currentCount= currentCount-1;
			}

		});  //end of volunteer LI loop

		$vacancyInstance.children("span").text(currentCount);
		checkGroupVacancyCount($memberList.attr("id"));
	});  //end of vacancyList loop

} //end of updateVacancyStatus


function updateGroupVacancies($memberList,$vacancyList,$volunteer,operator) {
	$vacancyList.children("li").each(function(i) {
		var $vacancyInstance= $(this);
		var conId= $vacancyInstance.attr("title");
		var currentCount= parseInt($vacancyInstance.children("span").text());
		if($volunteer.hasClass(conId))
			{
				if(operator== 'subtract')
					{
						currentCount= currentCount-1;
						$vacancyInstance.effect("highlight");
						$vacancyInstance.children("span").text(currentCount);
						checkGroupVacancyCount($memberList.attr("id"));
					}
				else
					{
						currentCount= currentCount+1;
						$vacancyInstance.effect("highlight");
						$vacancyInstance.children("span").text(currentCount);
						checkGroupVacancyCount($memberList.attr("id"));
					}
			}

	});  //end of $vacancyList loop

} //end of updateGroupVacancies



function checkGroupVacancyCount(groupId) {
	var vacancyTotal= 0;
	var vacancyProblem= false;
	$("#" + groupId).prev(".groupConsole").children(".vacancyListBlock").children(".vacancyList").children("li > span").each(function(i) {
		thisVacancy= parseInt($(this).text());
		if (thisVacancy < 0)
			{
				vacancyProblem= true;
			}
		vacancyTotal= vacancyTotal + thisVacancy;
	});

	if(vacancyProblem== true)
		{
			$("#" + groupId).parents(".groupBlock").removeClass("groupOpen");
			$("#" + groupId).parents(".groupBlock").removeClass("groupFilled");
			$("#" + groupId).parents(".groupBlock").addClass("groupProblem");
		}
	else if (vacancyTotal== 0)
		{
			$("#" + groupId).parents(".groupBlock").removeClass("groupOpen");
			$("#" + groupId).parents(".groupBlock").removeClass("groupProblem");
			$("#" + groupId).parents(".groupBlock").addClass("groupFilled");
		}
	else
		{
			$("#" + groupId).parents(".groupBlock").removeClass("groupFilled");
			$("#" + groupId).parents(".groupBlock").removeClass("groupProblem");
			$("#" + groupId).parents(".groupBlock").addClass("groupOpen");
		}

}  //end of checkGroupVacancyCount

function showOnlyVolunteersForOpenGroups() {
	$(".candidateContainer .volunteer").addClass("hideElement");
		$(".groupInfo").each(function(i) {
			if($(this).hasClass("hideElement")== false)
				{
					var openGroupId= $(this).children("ul").attr("id");
					$("div.prefBlock[alt='" + openGroupId + "']").parents("li.volunteer").removeClass("hideElement");

				}
		});
}  //end of showOnlyVolunteersForOpenGroups



